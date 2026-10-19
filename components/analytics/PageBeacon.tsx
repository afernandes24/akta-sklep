'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { isExcludedClient } from '@/lib/exclude';

/** Statystyki odwiedzin bez cookies: jedno małe zgłoszenie na wyświetlenie strony (bez panelu admina). */
export function PageBeacon() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || isExcludedClient()) return;
    const body = JSON.stringify({
      p: pathname,
      q: window.location.search.slice(0, 300),
      r: first.current ? document.referrer.slice(0, 300) : '',
    });
    first.current = false;
    try {
      if (!navigator.sendBeacon?.('/api/stat', new Blob([body], { type: 'application/json' }))) {
        fetch('/api/stat', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => undefined);
      }
    } catch {
      /* statystyki nigdy nie psują strony */
    }
  }, [pathname]);
  return null;
}
