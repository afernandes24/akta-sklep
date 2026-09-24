import 'server-only';
import { findValidCoupon } from './discounts';
import { sendOrderConfirmation } from './email';
import { allocateDiscount, type CouponRule, priceCart } from './pricing';
import { createAdminClient } from './supabase/admin';
import type { Order, OrderItem, ProductFormat } from './types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID_RE.test(v);

export type CreateOrderResult =
  | { kind: 'created'; order: Order; items: OrderItem[] }
  | { kind: 'already_owned' }
  | { kind: 'empty' }
  | { kind: 'coupon_invalid'; error: string };

/**
 * Tworzy zamówienie ze sprawdzonymi po stronie serwera cenami.
 * Pomija sprawy, które użytkownik już posiada, oraz nieopublikowane.
 */
export async function createOrder(params: {
  userId: string;
  email: string;
  caseIds: string[];
  provider: string;
  couponCode?: string | null;
}): Promise<CreateOrderResult> {
  // Pozycje w formacie "id:format" (starsze koszyki: samo id = PDF)
  const wanted = Array.from(
    new Map(
      params.caseIds
        .map((raw) => {
          const [id, f] = String(raw).split(':');
          return { id, format: (f === 'online' ? 'online' : 'pdf') as ProductFormat };
        })
        .filter((w) => isUuid(w.id))
        .map((w) => [`${w.id}:${w.format}`, w] as const),
    ).values(),
  ).slice(0, 50);
  const ids = Array.from(new Set(wanted.map((w) => w.id)));
  if (ids.length === 0) return { kind: 'empty' };

  const db = createAdminClient();

  const [{ data: cases, error: casesError }, { data: owned }] = await Promise.all([
    db.from('cases').select('id, title, case_number, price_grosze, currency, online_enabled, online_price_grosze').in('id', ids).eq('is_published', true),
    db.from('entitlements').select('case_id, format').eq('user_id', params.userId).in('case_id', ids),
  ]);
  if (casesError) throw new Error(casesError.message);
  if (!cases || cases.length === 0) return { kind: 'empty' };

  const ownedKeys = new Set((owned ?? []).map((o) => `${o.case_id}:${o.format ?? 'pdf'}`));
  const toBuy = wanted
    .map((w) => {
      const c = cases.find((x) => x.id === w.id);
      if (!c || ownedKeys.has(`${w.id}:${w.format}`)) return null;
      if (w.format === 'online' && !c.online_enabled) return null;
      const price = w.format === 'online' ? ((c.online_price_grosze as number | null) ?? (c.price_grosze as number)) : (c.price_grosze as number);
      return { ...c, format: w.format, price_grosze: price };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  if (toBuy.length === 0) return { kind: 'already_owned' };

  let coupon: CouponRule | null = null;
  if (params.couponCode) {
    const check = await findValidCoupon(params.couponCode, params.userId);
    if (!check.ok) return { kind: 'coupon_invalid', error: check.error };
    coupon = check.coupon;
  }

  const listPrices = toBuy.map((c) => c.price_grosze as number);
  const price = priceCart(listPrices, coupon);
  const itemPrices = allocateDiscount(listPrices, price.discount);

  const { data: order, error: orderError } = await db
    .from('orders')
    .insert({
      user_id: params.userId,
      email: params.email,
      status: 'pending',
      total_grosze: price.total,
      subtotal_grosze: price.subtotal,
      discount_grosze: price.discount,
      discount_code: price.source === 'coupon' ? coupon?.code : null,
      discount_label: price.label,
      currency: 'PLN',
      provider: params.provider,
      consent_digital_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (orderError || !order) throw new Error(orderError?.message ?? 'Nie udało się utworzyć zamówienia');

  const { data: items, error: itemsError } = await db
    .from('order_items')
    .insert(
      toBuy.map((c, i) => ({
        order_id: order.id,
        case_id: c.id,
        title: `AKTA #${c.case_number} — ${c.title}${c.format === 'online' ? ' (wersja online)' : ''}`,
        price_grosze: itemPrices[i],
        list_price_grosze: c.price_grosze,
        format: c.format,
      })),
    )
    .select('*');
  if (itemsError) throw new Error(itemsError.message);

  return { kind: 'created', order: order as Order, items: (items ?? []) as OrderItem[] };
}

export async function setProviderRef(orderId: string, providerRef: string) {
  await createAdminClient().from('orders').update({ provider_ref: providerRef }).eq('id', orderId);
}

/**
 * Oznacza zamówienie jako opłacone i nadaje dostęp do plików.
 * Idempotentne — bezpieczne przy wielokrotnym wywołaniu przez webhooki.
 */
export async function fulfillOrder(
  orderId: string,
  opts: { providerRef?: string; paidAmountGrosze?: number } = {},
): Promise<{ ok: boolean; reason?: string }> {
  const db = createAdminClient();
  const { data: order } = await db
    .from('orders')
    .select('id, user_id, status, total_grosze, discount_code')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return { ok: false, reason: 'not_found' };

  if (typeof opts.paidAmountGrosze === 'number' && opts.paidAmountGrosze !== order.total_grosze) {
    console.error(`[orders] Kwota się nie zgadza dla ${orderId}: ${opts.paidAmountGrosze} ≠ ${order.total_grosze}`);
    return { ok: false, reason: 'amount_mismatch' };
  }

  let newlyPaid = false;
  if (order.status !== 'paid') {
    const update: Record<string, unknown> = { status: 'paid', paid_at: new Date().toISOString() };
    if (opts.providerRef) update.provider_ref = opts.providerRef;
    const { data: changed, error } = await db.from('orders').update(update).eq('id', orderId).neq('status', 'paid').select('id');
    if (error) return { ok: false, reason: error.message };
    newlyPaid = Boolean(changed?.length);
    if (newlyPaid && order.discount_code) {
      await db.rpc('use_discount_code', { p_code: order.discount_code }).then(({ error: e }) => e && console.error('[orders] kod', e.message));
    }
  }

  if (!order.user_id) {
    if (newlyPaid) await sendOrderConfirmation(orderId).catch(() => undefined);
    return { ok: true };
  }

  const { data: items } = await db.from('order_items').select('case_id, format').eq('order_id', orderId);
  const rows = (items ?? [])
    .filter((i) => i.case_id)
    .map((i) => ({ user_id: order.user_id, case_id: i.case_id, order_id: orderId, format: i.format ?? 'pdf' }));
  if (rows.length) {
    const { error } = await db.from('entitlements').upsert(rows, { onConflict: 'user_id,case_id,format', ignoreDuplicates: true });
    if (error) return { ok: false, reason: error.message };
  }

  // Tylko raz — przy pierwszym oznaczeniu jako opłacone (webhooki mogą przyjść kilka razy).
  if (newlyPaid) {
    await sendOrderConfirmation(orderId).catch((e) => console.error('[orders] e-mail', e));
  }
  return { ok: true };
}

/** Zwrot płatności: zamówienie → „refunded”, odebranie dostępu przyznanego tym zamówieniem. */
export async function refundOrder(orderId: string): Promise<void> {
  const db = createAdminClient();
  await db.from('orders').update({ status: 'refunded' }).eq('id', orderId);
  await db.from('entitlements').delete().eq('order_id', orderId);
}

export async function markOrderStatus(orderId: string, status: 'failed' | 'cancelled') {
  await createAdminClient().from('orders').update({ status }).eq('id', orderId).eq('status', 'pending');
}
