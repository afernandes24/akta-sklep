'use client';

import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';
import { trackAddToCart } from '@/lib/analytics';
import type { CartItem } from '@/lib/types';

export function AddToCartButtons({
  item,
  variant = 'full',
  className = '',
}: {
  item: CartItem;
  variant?: 'full' | 'compact';
  className?: string;
}) {
  const { add, has, ready } = useCart();
  const router = useRouter();
  const inCart = ready && has(item.id);

  const addTracked = (i: CartItem) => {
    if (!has(i.id)) trackAddToCart({ id: i.id, title: i.title, priceGrosze: i.priceGrosze });
    add(i);
  };

  const buyNow = () => {
    addTracked(item);
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
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <button type="button" onClick={buyNow} className="btn-primary flex-1 text-base">
        Kup i pobierz
      </button>
      <button
        type="button"
        onClick={() => (inCart ? router.push('/koszyk') : addTracked(item))}
        className="btn-secondary flex-1"
        aria-live="polite"
      >
        {inCart ? '✓ W koszyku — przejdź' : 'Dodaj do koszyka'}
      </button>
    </div>
  );
}
