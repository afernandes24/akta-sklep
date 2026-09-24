'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from './CartProvider';
import { trackAddToCart } from '@/lib/analytics';
import { formatPrice } from '@/lib/format';
import { type CartItem, cartKey, type ProductFormat } from '@/lib/types';

export function AddToCartButtons({
  item,
  online,
  variant = 'full',
  className = '',
}: {
  /** Pozycja w wersji PDF (domyślnej). */
  item: CartItem;
  /** Jeśli sprawa ma wersję online — jej cena. */
  online?: { priceGrosze: number } | null;
  variant?: 'full' | 'compact';
  className?: string;
}) {
  const { add, has, ready } = useCart();
  const router = useRouter();
  const [format, setFormat] = useState<ProductFormat>('pdf');

  const chosen: CartItem =
    format === 'online' && online ? { ...item, format: 'online', priceGrosze: online.priceGrosze } : { ...item, format: 'pdf' };
  const inCart = ready && has(cartKey(chosen));

  const addTracked = (i: CartItem) => {
    if (!has(cartKey(i))) trackAddToCart({ id: i.id, title: i.title, priceGrosze: i.priceGrosze });
    add(i);
  };

  const buyNow = () => {
    addTracked(chosen);
    router.push('/koszyk');
  };

  if (variant === 'compact') {
    return (
      <button type="button" onClick={buyNow} className={`btn-primary w-full ${className}`}>
        {inCart ? 'Przejdź do koszyka' : 'Kup i pobierz'}
      </button>
    );
  }

  return (
    <div className={className}>
      {online && (
        <fieldset className="mb-4">
          <legend className="label">Wybierz wersję</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['pdf', 'PDF do druku', item.priceGrosze, 'Pobierasz, drukujesz, grasz przy stole'],
                ['online', 'Online w przeglądarce', online.priceGrosze, 'Te same akta na komputerze lub telefonie, bez drukowania'],
              ] as const
            ).map(([f, label, price, desc]) => (
              <label
                key={f}
                className={`flex cursor-pointer gap-3 rounded-md border p-3 text-sm transition ${format === f ? 'border-brass-400 bg-brass-400/10' : 'border-ink-700 hover:border-brass-500/50'}`}
              >
                <input type="radio" name="wersja" value={f} checked={format === f} onChange={() => setFormat(f)} className="mt-1 accent-brass-400" />
                <span className="flex-1">
                  <span className="flex justify-between gap-2 font-semibold text-paper-50">
                    {label} <span>{formatPrice(price)}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={buyNow} className="btn-primary flex-1 text-base">
          {format === 'online' ? 'Kup wersję online' : 'Kup i pobierz'}
        </button>
        <button type="button" onClick={() => (inCart ? router.push('/koszyk') : addTracked(chosen))} className="btn-secondary flex-1" aria-live="polite">
          {inCart ? '✓ W koszyku — przejdź' : 'Dodaj do koszyka'}
        </button>
      </div>
    </div>
  );
}
