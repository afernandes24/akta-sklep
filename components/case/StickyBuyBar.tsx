'use client';

import { useEffect, useState } from 'react';
import { AddToCartButtons } from '../cart/AddToCartButtons';
import type { CartItem } from '@/lib/types';

/** Pasek „Kup” przyklejony do dołu ekranu na telefonach, gdy główny przycisk zniknie z widoku. */
export function StickyBuyBar({ item, priceLabel }: { item: CartItem; priceLabel: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById('kup');
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
      threshold: 0,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-ink-700 bg-ink-950/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur transition-transform lg:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      inert={!visible}
    >
      <div className="mx-auto flex max-w-xl items-center gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted">AKTA #{item.caseNumber}</p>
          <p className="font-serif text-xl font-bold text-paper-50">{priceLabel}</p>
        </div>
        <div className="flex-1">
          <AddToCartButtons item={item} variant="compact" />
        </div>
      </div>
    </div>
  );
}
