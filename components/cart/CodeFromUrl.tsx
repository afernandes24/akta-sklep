'use client';

import { useEffect } from 'react';

/** Link z kodem (np. z maila: /sprawy?kod=DZIEKUJE20) — zapamiętujemy kod, koszyk wpisze go sam. */
export function CodeFromUrl() {
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get('kod');
      if (code && /^[A-Za-z0-9_-]{3,32}$/.test(code)) window.sessionStorage.setItem('akta-kod', code.toUpperCase());
    } catch {
      /* brak pamięci przeglądarki — kod wpisze się ręcznie */
    }
  }, []);
  return null;
}
