import type { PaymentProvider } from './types';

/**
 * TRYB TESTOWY — bez prawdziwych pieniędzy.
 * Klient trafia na stronę symulacji, gdzie może „opłacić” lub anulować zamówienie.
 */
export function mockPaymentsAllowed(): boolean {
  return (
    (process.env.PAYMENT_PROVIDER || 'mock') === 'mock' &&
    (process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_PAYMENTS === 'true')
  );
}

export const mockProvider: PaymentProvider = {
  id: 'mock',
  label: 'Płatność testowa',
  async createCheckout({ order }) {
    return { redirectUrl: `/zamowienie/${order.id}/platnosc-testowa`, providerRef: `mock_${order.order_number}` };
  },
};
