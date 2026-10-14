import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { fulfillOrder, markOrderStatus, refundOrder } from '@/lib/orders';
import { getStripe } from '@/lib/payments/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook Stripe. W panelu Stripe dodaj endpoint:
 *   https://TWOJA-DOMENA/api/platnosci/stripe/webhook
 * ze zdarzeniami: checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed, checkout.session.expired, charge.refunded
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');
  if (!secret || !signature) return NextResponse.json({ error: 'Brak konfiguracji webhooka' }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (e) {
    console.error('[stripe webhook] Nieprawidłowy podpis', e);
    return NextResponse.json({ error: 'Nieprawidłowy podpis' }, { status: 400 });
  }

  // Zwrot wykonany w panelu Stripe → odbieramy dostęp do plików z tego zamówienia
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    if (charge.refunded && charge.payment_intent) {
      const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent.id;
      const pi = await getStripe().paymentIntents.retrieve(piId);
      if (pi.metadata?.order_id) await refundOrder(pi.metadata.order_id);
    }
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.client_reference_id || session.metadata?.order_id;
  if (!orderId) return NextResponse.json({ received: true });

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      if (session.payment_status === 'paid') {
        const result = await fulfillOrder(orderId, {
          providerRef: session.id,
          paidAmountGrosze: session.amount_total ?? undefined,
          isTest: !event.livemode, // klucz sk_test → brak prawdziwych pieniędzy
        });
        if (!result.ok && result.reason !== 'amount_mismatch') {
          // 500 → Stripe ponowi próbę
          return NextResponse.json({ error: result.reason }, { status: 500 });
        }
      }
      break;
    }
    case 'checkout.session.async_payment_failed':
      await markOrderStatus(orderId, 'failed');
      break;
    case 'checkout.session.expired':
      await markOrderStatus(orderId, 'cancelled');
      break;
  }

  return NextResponse.json({ received: true });
}
