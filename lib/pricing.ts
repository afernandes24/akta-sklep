/**
 * Zasady rabatów — wspólne dla koszyka (podgląd) i serwera (ostateczna cena).
 * Rabat ilościowy i kod rabatowy NIE łączą się: klient dostaje korzystniejszy.
 */
export const VOLUME_TIERS = [
  { minItems: 3, percent: 20 },
  { minItems: 2, percent: 10 },
] as const;

/** Minimalna kwota płatności u operatora (Stripe, PLN). */
export const MIN_PAYMENT_GROSZE = 200;

export interface CouponRule {
  code: string;
  percent_off: number | null;
  amount_off_grosze: number | null;
  min_items: number;
}

export interface PriceBreakdown {
  subtotal: number;
  discount: number;
  total: number;
  /** Czytelny opis zastosowanego rabatu, np. „Rabat ilościowy −20% (3 sprawy)”. */
  label: string | null;
  source: 'volume' | 'coupon' | null;
  /** Kod podany przez klienta, ale niekorzystniejszy od rabatu ilościowego lub niespełniający warunków. */
  couponIgnoredReason?: string;
}

export function volumeDiscount(subtotal: number, count: number) {
  const tier = VOLUME_TIERS.find((t) => count >= t.minItems);
  if (!tier) return null;
  return { amount: Math.round((subtotal * tier.percent) / 100), label: `Rabat ilościowy −${tier.percent}% (${count} ${count >= 5 ? 'spraw' : 'sprawy'})` };
}

export function couponDiscount(subtotal: number, count: number, c: CouponRule) {
  if (count < c.min_items) return { amount: 0, label: '', error: `Kod ${c.code} działa od ${c.min_items} spraw w koszyku.` };
  const amount = c.percent_off ? Math.round((subtotal * c.percent_off) / 100) : Math.min(subtotal, c.amount_off_grosze ?? 0);
  const what = c.percent_off ? `−${c.percent_off}%` : `−${((c.amount_off_grosze ?? 0) / 100).toFixed(2).replace('.', ',')} zł`;
  return { amount, label: `Kod ${c.code} (${what})` };
}

export function priceCart(prices: number[], coupon?: CouponRule | null): PriceBreakdown {
  const subtotal = prices.reduce((s, p) => s + p, 0);
  const count = prices.length;
  const vol = volumeDiscount(subtotal, count);
  const cp = coupon ? couponDiscount(subtotal, count, coupon) : null;

  let best: { amount: number; label: string; source: 'volume' | 'coupon' } | null = null;
  if (vol) best = { ...vol, source: 'volume' };
  if (cp && !cp.error && cp.amount > (best?.amount ?? 0)) best = { amount: cp.amount, label: cp.label, source: 'coupon' };

  let couponIgnoredReason: string | undefined;
  if (cp?.error) couponIgnoredReason = cp.error;
  else if (cp && best?.source === 'volume') couponIgnoredReason = 'Rabat ilościowy jest korzystniejszy niż kod — rabaty się nie łączą.';

  let discount = Math.min(subtotal, best?.amount ?? 0);
  // Stripe nie przyjmuje płatności poniżej 2 zł — rabat nie może zejść niżej (0 zł = zamówienie darmowe, OK).
  if (subtotal - discount > 0 && subtotal - discount < MIN_PAYMENT_GROSZE && subtotal >= MIN_PAYMENT_GROSZE) discount = subtotal - MIN_PAYMENT_GROSZE;
  return { subtotal, discount, total: subtotal - discount, label: best?.label ?? null, source: best?.source ?? null, couponIgnoredReason };
}

/** Rozkłada rabat na pozycje proporcjonalnie (suma cen pozycji = kwota do zapłaty). */
export function allocateDiscount(prices: number[], discount: number): number[] {
  const subtotal = prices.reduce((s, p) => s + p, 0);
  if (!discount || !subtotal) return prices.slice();
  const d = Math.min(discount, subtotal);
  // Każda pozycja dostaje zaokrągloną w dół część rabatu; resztę (kilka groszy) odejmujemy od kolejnych pozycji.
  const out = prices.map((p) => p - Math.floor((p * d) / subtotal));
  let rest = out.reduce((s, p) => s + p, 0) - (subtotal - d);
  for (let i = 0; rest > 0 && i < out.length * 2; i++) {
    const k = i % out.length;
    if (out[k] > 0) {
      out[k] -= 1;
      rest -= 1;
    }
  }
  return out;
}

export function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}
