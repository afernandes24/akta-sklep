'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';

export function CartLink() {
  const { items, ready } = useCart();
  const count = ready ? items.length : 0;
  return (
    <Link href="/koszyk" className="btn-ghost relative" aria-label={`Koszyk, ${count} pozycji`}>
      <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9.5" cy="20" r="1.3" />
        <circle cx="17.5" cy="20" r="1.3" />
      </svg>
      <span className="hidden sm:inline">Koszyk</span>
      {count > 0 && (
        <span className="absolute right-0.5 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass-400 px-1 text-[11px] font-bold text-ink-950 sm:static">
          {count}
        </span>
      )}
    </Link>
  );
}
