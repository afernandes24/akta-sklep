import 'server-only';
import { mockPaymentsAllowed, mockProvider } from './mock';
import { przelewy24Provider } from './przelewy24';
import { stripeProvider } from './stripe';
import type { PaymentProvider, PaymentProviderId } from './types';

export function getPaymentProviderId(): PaymentProviderId {
  const id = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
  if (id === 'stripe' || id === 'przelewy24') return id;
  return 'mock';
}

/** Zwraca skonfigurowanego operatora lub null, jeśli płatności nie są gotowe. */
export function getPaymentProvider(): PaymentProvider | null {
  const id = getPaymentProviderId();
  if (id === 'stripe') return process.env.STRIPE_SECRET_KEY ? stripeProvider : null;
  if (id === 'przelewy24') {
    return process.env.P24_MERCHANT_ID && process.env.P24_API_KEY && process.env.P24_CRC ? przelewy24Provider : null;
  }
  return mockPaymentsAllowed() ? mockProvider : null;
}

export function getProviderById(id: string): PaymentProvider | null {
  if (id === 'stripe') return stripeProvider;
  if (id === 'przelewy24') return przelewy24Provider;
  if (id === 'mock') return mockProvider;
  return null;
}

export type { PaymentProvider } from './types';
