'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { codeInfo, type CodeInfo } from '@/app/koszyk/code-info';

const CODE_KEY = 'akta-kod';
const INFO_KEY = 'akta-kod-info';
const HIDE_KEY = 'akta-kod-ukryj';

/**
 * Link z kodem (reklama, mail: /sprawy?kod=DRUGA50) — zapamiętujemy kod (koszyk wpisze go sam)
 * i pokazujemy pasek „Kod aktywny”, żeby było widać, że rabat działa.
 */
export function CodeFromUrl() {
  const pathname = usePathname();
  const [info, setInfo] = useState<NonNullable<CodeInfo> | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let code: string | null = null;
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('kod');
      if (fromUrl && /^[A-Za-z0-9_-]{3,32}$/.test(fromUrl)) window.sessionStorage.setItem(CODE_KEY, fromUrl.toUpperCase());
      code = window.sessionStorage.getItem(CODE_KEY);
      setHidden(window.sessionStorage.getItem(HIDE_KEY) === code);
      const cached = window.sessionStorage.getItem(INFO_KEY);
      if (cached) {
        const c = JSON.parse(cached) as CodeInfo;
        if (c && c.code === code) return setInfo(c);
      }
    } catch {
      /* brak pamięci przeglądarki — kod wpisze się ręcznie */
    }
    if (!code) return;
    codeInfo(code)
      .then((c) => {
        if (!c) return;
        setInfo(c);
        try {
          window.sessionStorage.setItem(INFO_KEY, JSON.stringify(c));
        } catch {
          /* trudno */
        }
      })
      .catch(() => undefined);
  }, [pathname]);

  // Koszyk sam pokazuje kod; w panelu admina pasek niepotrzebny
  if (!info || hidden || pathname?.startsWith('/koszyk') || pathname?.startsWith('/admin')) return null;
  const hide = () => {
    setHidden(true);
    try {
      window.sessionStorage.setItem(HIDE_KEY, info.code);
    } catch {
      /* trudno */
    }
  };
  return (
    <div className="border-b border-brass-400/30 bg-brass-400/10" role="status">
      <div className="container-page flex items-center gap-3 py-2.5 text-sm">
        <span aria-hidden className="text-lg">
          🎁
        </span>
        <p className="min-w-0 flex-1 leading-snug text-paper-100">
          Kod <strong className="font-mono tracking-wider text-brass-300">{info.code}</strong> aktywny: <strong>{info.text}</strong>
          {info.until && <span className="text-paper-200"> · do {info.until}</span>}
          <span className="hidden text-paper-200 sm:inline"> — {info.hint}</span>
          <span className="block text-xs text-paper-200 sm:hidden">{info.hint}</span>
        </p>
        {!pathname?.startsWith('/sprawy') || pathname.split('/').length > 2 ? (
          <Link href="/sprawy" className="hidden shrink-0 rounded-full border border-brass-400/60 px-3 py-1 text-xs font-semibold text-brass-300 hover:bg-brass-400/10 sm:inline-block">
            Wybierz sprawy
          </Link>
        ) : null}
        <button type="button" onClick={hide} aria-label="Ukryj pasek z kodem" className="shrink-0 px-1 text-lg leading-none text-muted hover:text-paper-100">
          ×
        </button>
      </div>
    </div>
  );
}
