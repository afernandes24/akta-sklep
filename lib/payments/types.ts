import type { Order, OrderItem } from '../types';

export type PaymentProviderId = 'mock' | 'stripe' | 'przelewy24';

export interface CheckoutInput {
  order: Order;
  items: OrderItem[];
  email: string;
  /** Adres strony potwierdzenia zamówienia. */
  returnUrl: string;
  /** Adres, na który wraca klient po anulowaniu płatności. */
  cancelUrl: string;
}

export interface CheckoutResult {
  redirectUrl: string;
  providerRef?: string;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  label: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /**
   * Opcjonalne: sprawdzenie statusu po powrocie klienta na stronę
   * (zabezpieczenie na wypadek opóźnionego webhooka).
   */
  confirmOnReturn?(order: Order, searchParams: Record<string, string | undefined>): Promise<void>;
}
