'use client';

import { useRouter } from 'next/navigation';
import { trackAddToCart } from '@/lib/analytics';
import { formatPrice } from '@/lib/format';
import { priceCart } from '@/lib/pricing';
import type { CartItem } from '@/lib/types';
import { CaseCover } from '../case/CaseCover';
import { useCart } from './CartProvider';

export function BundleCard({ title, description, items }: { title: string; description: string; items: CartItem[] }) {
  const { add, has, ready } = useCart();
  const router = useRouter();
  const price = priceCart(items.map((i) => i.priceGrosze));
  const allIn = ready && items.every((i) => has(i.id));

  const addAll = () => {
    items.forEach((i) => {
      if (!has(i.id)) trackAddToCart({ id: i.id, title: i.title, priceGrosze: i.priceGrosze });
      add(i);
    });
    router.push('/koszyk');
  };

  return (
    <article className="card flex flex-col p-5">
      <div className="flex justify-center -space-x-6 px-4 pt-2">
        {items.map((i, n) => (
          <div key={i.id} className={`w-[34%] ${n === 1 ? 'z-10 -translate-y-2' : n === 0 ? '-rotate-6' : 'rotate-6'}`}>
            <CaseCover caseNumber={i.caseNumber} title={i.title} size="xs" />
          </div>
        ))}
      </div>
      <h3 className="mt-6 font-serif text-2xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <ul className="mt-3 space-y-1 text-sm text-paper-200">
        {items.map((i) => (
          <li key={i.id}>
            <span className="font-mono text-brass-400">#{i.caseNumber}</span> {i.title}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-5">
        <p className="flex items-baseline gap-3">
          <span className="font-serif text-3xl font-bold text-paper-50">{formatPrice(price.total)}</span>
          {price.discount > 0 && <span className="text-sm text-emerald-300">oszczędzasz {formatPrice(price.discount)}</span>}
        </p>
        <p className="mt-1 text-xs text-muted">Cena z automatycznym rabatem ilościowym. Kupione osobno: {formatPrice(price.subtotal)}.</p>
        <button type="button" onClick={addAll} className="btn-primary mt-4 w-full">
          {allIn ? 'Przejdź do koszyka' : 'Dodaj pakiet do koszyka'}
        </button>
      </div>
    </article>
  );
}
