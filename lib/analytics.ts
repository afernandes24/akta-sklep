'use client';

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

function gtag(): Gtag | null {
  return typeof window !== 'undefined' && typeof (window as unknown as { gtag?: Gtag }).gtag === 'function'
    ? (window as unknown as { gtag: Gtag }).gtag
    : null;
}
function fbq(): Fbq | null {
  return typeof window !== 'undefined' && typeof (window as unknown as { fbq?: Fbq }).fbq === 'function'
    ? (window as unknown as { fbq: Fbq }).fbq
    : null;
}

/** Zdarzenia wysyłane tylko, jeśli użytkownik wyraził zgodę (skrypty są wtedy załadowane). */
export function trackAddToCart(item: { id: string; title: string; priceGrosze: number }) {
  const value = item.priceGrosze / 100;
  gtag()?.('event', 'add_to_cart', { currency: 'PLN', value, items: [{ item_id: item.id, item_name: item.title, price: value, quantity: 1 }] });
  fbq()?.('track', 'AddToCart', { currency: 'PLN', value, content_ids: [item.id], content_type: 'product' });
}

export function trackViewItem(item: { id: string; title: string; priceGrosze: number }) {
  const value = item.priceGrosze / 100;
  gtag()?.('event', 'view_item', { currency: 'PLN', value, items: [{ item_id: item.id, item_name: item.title, price: value }] });
  fbq()?.('track', 'ViewContent', { currency: 'PLN', value, content_ids: [item.id], content_type: 'product' });
}

export function trackPurchase(order: { id: string; totalGrosze: number; items: { id: string; title: string; priceGrosze: number }[] }) {
  const key = `akta-purchase-${order.id}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');
  } catch {
    /* ignoruj */
  }
  const value = order.totalGrosze / 100;
  gtag()?.('event', 'purchase', {
    transaction_id: order.id,
    currency: 'PLN',
    value,
    items: order.items.map((i) => ({ item_id: i.id, item_name: i.title, price: i.priceGrosze / 100, quantity: 1 })),
  });
  fbq()?.('track', 'Purchase', { currency: 'PLN', value, content_ids: order.items.map((i) => i.id), content_type: 'product' }, { eventID: order.id });
}
