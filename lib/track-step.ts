'use client';

import { isExcludedClient } from '@/lib/exclude';

/**
 * Kroki w koszyku do statystyk sklepu (bez cookies): „wpisał e-mail”, „kliknął Zamawiam”, „błąd”.
 * Idą tym samym kanałem co wyświetlenia stron, jako ścieżka /_e/<krok> — statystyki liczą je osobno, nie jako strony.
 * Każdy krok najwyżej raz na kartę przeglądarki.
 */
export type CartStep = 'email' | 'zamawiam' | 'blad';

export function trackStep(step: CartStep) {
  try {
    if (isExcludedClient()) return;
    const key = `akta-krok-${step}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');
    const body = JSON.stringify({ p: `/_e/${step}`, q: '', r: '', w: navigator.webdriver ? 1 : 0 });
    if (!navigator.sendBeacon?.('/api/stat', new Blob([body], { type: 'application/json' }))) {
      fetch('/api/stat', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => undefined);
    }
  } catch {
    /* statystyki nigdy nie psują strony */
  }
}
