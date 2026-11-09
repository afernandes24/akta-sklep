'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/format';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { geoFromHeaders } from '@/lib/stats-shared';
import { getUser } from '@/lib/auth';
import { isServiceRoleConfigured, siteConfig } from '@/lib/config';
import { findValidCoupon } from '@/lib/discounts';
import { allow, clientIp } from '@/lib/rate-limit';
import { createOrder, fulfillOrder, markOrderStatus, setProviderRef } from '@/lib/orders';
import type { CouponRule } from '@/lib/pricing';
import { getPaymentProvider, getPaymentProviderId } from '@/lib/payments';
import { channelOf, parseTouch, type Touch } from '@/lib/attribution';
import { visitorHash } from '@/lib/visitor';
import { hasImpossibleTld, suggestEmail } from '@/lib/email-typo';
import { parseGift } from '@/lib/gift-form';

export type CheckoutState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  if (!isServiceRoleConfigured()) {
    return { error: 'Sklep nie jest jeszcze połączony z bazą danych. Uzupełnij konfigurację Supabase (README).' };
  }

  // Zalogowany klient kupuje na konto; gość podaje tylko e-mail i dostaje link dostępu.
  const user = await getUser();
  const guestEmail = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200);
  const buyerEmail = user?.email ?? guestEmail;
  if (!user) {
    if (!EMAIL_RE.test(guestEmail)) return { error: 'Podaj poprawny adres e-mail — wyślemy na niego link do plików.' };
    if (hasImpossibleTld(guestEmail)) {
      const fix = suggestEmail(guestEmail);
      return { error: `Adres e-mail ma literówkę na końcu${fix ? ` — chodziło o ${fix}?` : '.'} Popraw go, żeby link do plików na pewno doszedł.` };
    }
    if (!allow(`guest-checkout:${await clientIp()}`, 10, 60 * 60 * 1000)) return { error: 'Zbyt wiele prób. Spróbuj ponownie za chwilę.' };
  }

  if (formData.get('terms') !== 'on' || formData.get('digital_consent') !== 'on') {
    return { error: 'Aby kontynuować, zaakceptuj regulamin i wyraź zgodę na natychmiastowe dostarczenie plików.' };
  }

  const provider = getPaymentProvider();
  if (!provider) {
    return { error: 'Płatności nie są jeszcze skonfigurowane. Spróbuj ponownie później lub skontaktuj się z nami.' };
  }
  if (!user && provider.id === 'mock') {
    return { error: 'W trybie testowym płatności zakup bez konta jest wyłączony — zaloguj się.' };
  }

  const caseIds = formData.getAll('caseId').map(String);
  const gift = parseGift(formData);
  if (gift && 'error' in gift) return { error: gift.error };

  let redirectTo: string;
  let orderIdForCleanup: string | null = null;
  try {
    const couponCode = String(formData.get('coupon') ?? '').trim() || null;
    const expectedRaw = Number.parseInt(String(formData.get('expectedTotal') ?? ''), 10);
    const result = await createOrder({
      userId: user?.id ?? null,
      email: buyerEmail,
      caseIds,
      provider: getPaymentProviderId(),
      couponCode,
      expectedTotal: Number.isFinite(expectedRaw) ? expectedRaw : null,
      forGift: Boolean(gift),
    });
    if (result.kind === 'empty') return { error: 'Koszyk jest pusty albo wybrane sprawy nie są już dostępne.' };
    if (result.kind === 'coupon_invalid') return { error: `Kod rabatowy: ${result.error} Usuń kod, aby kontynuować.` };
    if (result.kind === 'price_changed')
      return { error: `Kwota do zapłaty zmieniła się na ${formatPrice(result.total)} (zmiana ceny, rabatu albo część spraw już masz). Odśwież stronę koszyka i sprawdź zamówienie.` };
    if (result.kind === 'created' && !user && !result.order.access_token) {
      // Baza bez kolumny access_token (nie uruchomiono supabase/zakup-bez-konta.sql)
      await markOrderStatus(result.order.id, 'failed');
      return { error: 'Zakup bez konta jest chwilowo niedostępny — zaloguj się albo załóż konto.' };
    }
    if (result.kind === 'created' && gift) {
      // Zakup jako prezent: dane obdarowanego zapisujemy przed płatnością (prezent wyjdzie po opłaceniu, w wybranym dniu)
      const { error: giftError } = await createAdminClient().from('orders').update({ ...gift, gift_kind: 'case' }).eq('id', result.order.id);
      if (giftError) {
        await markOrderStatus(result.order.id, 'failed');
        return { error: 'Zakup jako prezent jest chwilowo niedostępny — odznacz „To prezent” albo spróbuj później.' };
      }
    }
    if (result.kind === 'already_owned') {
      redirectTo = '/konto/sprawy?info=posiadane';
    } else if (result.order.total_grosze === 0) {
      await fulfillOrder(result.order.id);
      redirectTo = user ? `/zamowienie/${result.order.id}` : `/dostep/${result.order.access_token}`;
    } else {
      orderIdForCleanup = result.order.id;
      // Przybliżona lokalizacja kupującego (kraj / województwo / miasto) — do mapy w statystykach
      const h = await headers();
      const geo = geoFromHeaders(h);
      const geoRow = { geo_country: geo.country, geo_region: geo.region, geo_city: geo.city };
      const geoRes = await createAdminClient().from('orders').update({ ...geoRow, geo_lat: geo.lat, geo_lon: geo.lon }).eq('id', result.order.id);
      if (geoRes.error) await createAdminClient().from('orders').update(geoRow).eq('id', result.order.id);
      // Skąd przyszedł kupujący (reklama / mail / Google…) — do statystyk „co sprzedaje”
      await saveOrderSource(result.order.id, parseTouch(formData.get('src')), h).catch((e) => console.error('[checkout:source]', e));
      const { redirectUrl, providerRef } = await provider.createCheckout({
        order: result.order,
        items: result.items,
        email: buyerEmail,
        returnUrl: user ? `${siteConfig.url}/zamowienie/${result.order.id}` : `${siteConfig.url}/dostep/${result.order.access_token}`,
        cancelUrl: `${siteConfig.url}/koszyk?anulowano=1`,
      });
      if (providerRef) await setProviderRef(result.order.id, providerRef);
      redirectTo = redirectUrl;
    }
  } catch (e) {
    console.error('[checkout]', e);
    if (orderIdForCleanup) await markOrderStatus(orderIdForCleanup, 'failed');
    return { error: 'Nie udało się rozpocząć płatności. Spróbuj ponownie za chwilę.' };
  }

  redirect(redirectTo);
}

export type CouponResult = { coupon?: CouponRule; error?: string };

/** Podgląd kodu rabatowego w koszyku (ostateczna cena liczona jest ponownie przy zamówieniu). */
export async function checkCoupon(code: string): Promise<CouponResult> {
  if (!isServiceRoleConfigured()) return { error: 'Kody rabatowe zadziałają po podłączeniu bazy danych.' };
  if (!code.trim()) return { error: 'Wpisz kod.' };
  const user = await getUser();
  if (!allow(`coupon:${user?.id ?? await clientIp()}`, 10, 10 * 60 * 1000)) return { error: 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.' };
  const res = await findValidCoupon(code, user?.id);
  return res.ok ? { coupon: res.coupon } : { error: res.error };
}

/** Aktualne ceny pozycji koszyka z bazy (koszyk w przeglądarce mógł się zestarzeć). null = niedostępna. */
export async function freshCartPrices(keys: string[]): Promise<Record<string, number | null>> {
  if (!isServiceRoleConfigured()) return {};
  const wanted = keys.slice(0, 50).map((k) => {
    const [id, f] = String(k).split(':');
    return { key: k, id, format: f === 'online' ? 'online' : 'pdf' };
  });
  const ids = Array.from(new Set(wanted.map((w) => w.id))).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!ids.length) return {};
  const { data } = await createAdminClient()
    .from('cases')
    .select('id, price_grosze, online_enabled, online_price_grosze, is_published')
    .in('id', ids);
  const out: Record<string, number | null> = {};
  for (const w of wanted) {
    const c = data?.find((x) => x.id === w.id);
    if (!c) continue;
    if (!c.is_published || (w.format === 'online' && !c.online_enabled)) out[w.key] = null;
    else out[w.key] = w.format === 'online' ? ((c.online_price_grosze as number | null) ?? (c.price_grosze as number)) : (c.price_grosze as number);
  }
  return out;
}

/** Zapisuje źródło zamówienia. Gdy przeglądarka nic nie przekazała — szuka dzisiejszego wejścia tej samej osoby w statystykach. */
async function saveOrderSource(orderId: string, touch: Touch | null, h: Headers) {
  const db = createAdminClient();
  const visitor = visitorHash(h);
  let t = touch;
  if (!t) {
    const { data } = await db
      .from('page_views')
      .select('path, utm_source, utm_medium, utm_campaign, referrer_host')
      .eq('visitor', visitor)
      .order('at', { ascending: true })
      .limit(200);
    const rows = (data ?? []) as { path: string; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; referrer_host: string | null }[];
    const hit = rows.find((r) => r.utm_source || r.utm_medium || r.utm_campaign || (r.referrer_host && !/stripe\.com$/.test(r.referrer_host)));
    if (hit) t = { s: hit.utm_source, m: hit.utm_medium, c: hit.utm_campaign, ref: hit.referrer_host, lp: hit.path };
    else if (rows.length) t = { lp: rows[0].path };
  }
  const channel = t && (t.s || t.m || t.c || t.cid || t.ref) ? channelOf(t) : noSourceChannel(t);
  // Kolumny z supabase/statystyki-zrodla.sql — bez nich zapis po prostu się nie uda (zamówienie działa normalnie)
  await db
    .from('orders')
    .update({
      src_channel: channel,
      src_source: t?.s ?? t?.ref ?? null,
      src_medium: t?.m ?? null,
      src_campaign: t?.c ?? null,
      src_content: t?.ct ?? null,
      src_landing: t?.lp ?? null,
      visitor,
    })
    .eq('id', orderId);
}

/** Bez żadnej informacji o źródle: ktoś wpisał adres / ma zakładkę (albo przyszedł innego dnia). */
function noSourceChannel(t: Touch | null): string {
  return t ? 'Bezpośrednio' : 'Nieznane';
}
