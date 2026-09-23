'use client';

import { useEffect } from 'react';
import { useCart } from '../cart/CartProvider';

/** Po udanym zakupie usuwa kupione sprawy z koszyka. */
export function ClearPurchasedFromCart({ caseIds }: { caseIds: string[] }) {
  const { remove, ready } = useCart();
  useEffect(() => {
    if (ready) caseIds.forEach(remove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return null;
}
