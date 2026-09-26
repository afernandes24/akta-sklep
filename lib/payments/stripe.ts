import 'server-only';
import Stripe from 'stripe';
import { fulfillOrder } from '../orders';
import type { PaymentProvider } from './types';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Brak STRIPE_SECRET_KEY — uzupełnij zmienne środowiskowe.');
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}

/**
 * Stripe Checkout. Metody płatności (karta, BLIK, Przelewy24, Apple/Google Pay)
 * włączasz w panelu Stripe: Settings → Payment methods.
 */
export const stripeProvider: PaymentProvider = {
  id: 'stripe',
  label: 'Stripe',
  async createCheckout({ order, items, email, returnUrl, cancelUrl }) {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      locale: 'pl',
      customer_email: email,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      payment_intent_data: { metadata: { order_id: order.id } },
      line_items: items.map((item) => ({
        quantity: 1,
        price_data: {
          currency: 'pln',
          unit_amount: item.price_grosze,
          product_data: { name: item.title },
        },
      })),
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      custom_text: {
        submit: {
          message:
            `Kupujesz treść cyfrową (${items.some((i) => i.format === 'online') ? (items.some((i) => i.format !== 'online') ? 'PDF i wersja online' : 'wersja online') : 'PDF'}). Zgodnie ze złożonym oświadczeniem dostęp otrzymasz natychmiast po płatności, a prawo odstąpienia od umowy wygaśnie.`,
        },
      },
      // Faktury z panelu Stripe (opcjonalnie — Stripe pobiera za to dodatkową opłatę)
      ...(process.env.STRIPE_INVOICES === 'true'
        ? {
            invoice_creation: { enabled: true, invoice_data: { metadata: { order_id: order.id } } },
            tax_id_collection: { enabled: true },
          }
        : {}),
    });
    if (!session.url) throw new Error('Stripe nie zwrócił adresu płatności.');
    return { redirectUrl: session.url, providerRef: session.id };
  },

  async confirmOnReturn(order, searchParams) {
    const sessionId = searchParams.session_id;
    if (!sessionId || order.status !== 'pending') return;
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      if (session.client_reference_id === order.id && session.payment_status === 'paid') {
        await fulfillOrder(order.id, { providerRef: session.id, paidAmountGrosze: session.amount_total ?? undefined });
      }
    } catch (e) {
      console.error('[stripe] confirmOnReturn', e);
    }
  },
};
