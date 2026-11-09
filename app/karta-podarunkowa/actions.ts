'use server';

import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { isServiceRoleConfigured, siteConfig } from '@/lib/config';
import { hasImpossibleTld, suggestEmail } from '@/lib/email-typo';
import { formatPrice } from '@/lib/format';
import { parseGift } from '@/lib/gift-form';
import { GIFT_CARD_AMOUNTS } from '@/lib/gifts';
import { markOrderStatus, setProviderRef } from '@/lib/orders';
import { getPaymentProvider, getPaymentProviderId } from '@/lib/payments';
import { allow, clientIp } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Order, OrderItem } from '@/lib/types';

export type GiftCardState = { error?: string };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function startGiftCardCheckout(_prev: GiftCardState, formData: FormData): Promise<GiftCardState> {
  if (!isServiceRoleConfigured()) return { error: 'Sklep nie jest jeszcze połączony z bazą danych.' };
  const amount = Number(formData.get('amount'));
  if (!(GIFT_CARD_AMOUNTS as readonly number[]).includes(amount)) return { error: 'Wybierz wartość karty.' };

  const user = await getUser();
  const email = (user?.email ?? String(formData.get('email') ?? '')).trim().toLowerCase().slice(0, 200);
  if (!EMAIL_RE.test(email)) return { error: 'Podaj swój adres e-mail — wyślemy na niego potwierdzenie.' };
  if (hasImpossibleTld(email)) {
    const fix = suggestEmail(email);
    return { error: `Adres e-mail ma literówkę na końcu${fix ? ` — chodziło o ${fix}?` : '.'}` };
  }
  if (formData.get('terms') !== 'on') return { error: 'Zaakceptuj regulamin, aby kontynuować.' };
  if (!allow(`gift-card:${await clientIp()}`, 10, 60 * 60 * 1000)) return { error: 'Zbyt wiele prób. Spróbuj ponownie za chwilę.' };

  // Dla kogo: „dla siebie” = kod przyjdzie na adres kupującego od razu po płatności
  const forSelf = formData.get('recipient') === 'self';
  const gift = forSelf
    ? { gift_to_email: email, gift_to_name: null, gift_from_name: null, gift_message: null, gift_send_at: new Date().toISOString() }
    : parseGift(formData, true);
  if (!gift) return { error: 'Podaj dane obdarowanego.' };
  if ('error' in gift) return { error: gift.error };

  const provider = getPaymentProvider();
  if (!provider) return { error: 'Płatności nie są jeszcze skonfigurowane.' };
  if (provider.id === 'mock' && !user) return { error: 'W trybie testowym płatności zaloguj się.' };

  const db = createAdminClient();
  const title = `Karta podarunkowa Akta Detektywa — ${formatPrice(amount)}`;
  let redirectTo: string;
  let orderId: string | null = null;
  try {
    const { data: order, error } = await db
      .from('orders')
      .insert({
        user_id: user?.id ?? null,
        email,
        status: 'pending',
        total_grosze: amount,
        subtotal_grosze: amount,
        discount_grosze: 0,
        currency: 'PLN',
        provider: getPaymentProviderId(),
        gift_kind: 'card',
        gift_card_grosze: amount,
        ...gift,
      })
      .select('*')
      .single();
    if (error || !order) {
      console.error('[karta]', error?.message);
      return { error: 'Karty podarunkowe są chwilowo niedostępne. Spróbuj później.' };
    }
    orderId = order.id as string;
    const { data: items, error: itemsError } = await db
      .from('order_items')
      .insert({ order_id: order.id, case_id: null, title, price_grosze: amount, list_price_grosze: amount, format: 'pdf' })
      .select('*');
    if (itemsError) throw new Error(itemsError.message);
    const back = `${siteConfig.url}/prezent/${order.access_token}`;
    const { redirectUrl, providerRef } = await provider.createCheckout({
      order: order as Order,
      items: (items ?? []) as OrderItem[],
      email,
      returnUrl: back,
      cancelUrl: `${siteConfig.url}/karta-podarunkowa?anulowano=1`,
    });
    if (providerRef) await setProviderRef(order.id as string, providerRef);
    redirectTo = redirectUrl;
  } catch (e) {
    console.error('[karta]', e);
    if (orderId) await markOrderStatus(orderId, 'failed');
    return { error: 'Nie udało się rozpocząć płatności. Spróbuj ponownie za chwilę.' };
  }
  redirect(redirectTo);
}
