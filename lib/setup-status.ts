import 'server-only';
import { siteConfig } from './config';
import { isLegalDataComplete } from './legal/seller';
import { getPaymentProviderId } from './payments';

export interface SetupCheck {
  label: string;
  ok: boolean;
  hint: string;
}

/** Lista kontrolna gotowości sklepu do sprzedaży — wyświetlana w panelu admina. */
export function getSetupChecks(): SetupCheck[] {
  const provider = getPaymentProviderId();
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? '';
  return [
    {
      label: 'Adres strony',
      ok: !siteConfig.url.includes('localhost'),
      hint: 'Ustaw NEXT_PUBLIC_SITE_URL na docelową domenę (https://…).',
    },
    {
      label: 'Klucz service_role Supabase',
      ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hint: 'Uzupełnij SUPABASE_SERVICE_ROLE_KEY.',
    },
    {
      label: 'Dane sprzedawcy w dokumentach prawnych',
      ok: isLegalDataComplete(),
      hint: 'Uzupełnij plik lib/legal/seller.ts (nazwa, adres, NIP, data).',
    },
    {
      label: 'Operator płatności',
      ok: provider !== 'mock',
      hint: 'Ustaw PAYMENT_PROVIDER=stripe (teraz: tryb testowy).',
    },
    {
      label: 'Klucz Stripe',
      ok: provider !== 'stripe' || /^(sk|rk)_/.test(stripeKey),
      hint: 'Uzupełnij STRIPE_SECRET_KEY (sk_… albo klucz ograniczony rk_…; _test_ do testów, _live_ na produkcji).',
    },
    {
      label: 'Klucz Stripe w trybie produkcyjnym',
      ok: provider !== 'stripe' || /^(sk|rk)_live_/.test(stripeKey),
      hint: 'Używasz klucza testowego — prawdziwe płatności nie są pobierane.',
    },
    {
      label: 'Webhook Stripe',
      ok: provider !== 'stripe' || Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      hint: 'Dodaj endpoint w Stripe i uzupełnij STRIPE_WEBHOOK_SECRET (instrukcja: STRIPE.md).',
    },
    {
      label: 'E-maile z potwierdzeniem zamówienia',
      ok: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
      hint: 'Wymagane prawnie przy sprzedaży PDF. Uzupełnij RESEND_API_KEY i EMAIL_FROM.',
    },
    {
      label: 'Adres e-mail do kontaktu',
      ok: Boolean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
      hint: 'Uzupełnij NEXT_PUBLIC_CONTACT_EMAIL.',
    },
  ];
}
