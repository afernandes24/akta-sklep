'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type CartItem, cartKey } from '@/lib/types';

const STORAGE_KEY = 'akta-koszyk-v1';

interface CartContextValue {
  items: CartItem[];
  ready: boolean;
  add: (item: CartItem) => void;
  /** Usuwa pozycję po kluczu (cartKey) albo wszystkie wersje sprawy po samym id. */
  remove: (keyOrId: string) => void;
  clear: () => void;
  has: (key: string) => boolean;
  totalGrosze: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && typeof i.id === 'string').map((i) => ({ ...i, format: i.format ?? 'pdf' })) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((update: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = update(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* tryb prywatny — koszyk działa do odświeżenia strony */
      }
      return next;
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      add: (item) => persist((prev) => (prev.some((i) => cartKey(i) === cartKey(item)) ? prev : [...prev, { ...item, format: item.format ?? 'pdf' }])),
      remove: (keyOrId) => persist((prev) => prev.filter((i) => cartKey(i) !== keyOrId && i.id !== keyOrId)),
      clear: () => persist(() => []),
      has: (key) => items.some((i) => cartKey(i) === key),
      totalGrosze: items.reduce((sum, i) => sum + i.priceGrosze, 0),
    }),
    [items, ready, persist],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart musi być użyte wewnątrz <CartProvider>');
  return ctx;
}
