'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { isExcludedClient } from '@/lib/exclude';
import { hasSource, TOUCH_KEY, touchFromUrl } from '@/lib/attribution';

/** Statystyki odwiedzin bez cookies: jedno małe zgłoszenie na wyświetlenie strony (bez panelu admina). */
export function PageBeacon() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    if (first.current) {
      try {
        const t = touchFromUrl(window.location.search, document.referrer, window.location.hostname, pathname);
        // Wejście z oznaczonym źródłem nadpisuje poprzednie; zwykłe przejście po sklepie nie
        if (hasSource(t)) window.sessionStorage.setItem(TOUCH_KEY, JSON.stringify(t));
      } catch {
        /* brak dostępu do sessionStorage — trudno */
      }
    }
    if (isExcludedClient()) return;
    const body = JSON.stringify({
      p: pathname,
      q: window.location.search.slice(0, 300),
      r: first.current ? document.referrer.slice(0, 300) : '',
      w: navigator.webdriver ? 1 : 0,
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
