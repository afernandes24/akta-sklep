'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CaseCover } from '@/components/case/CaseCover';
import { FreeCaseForm } from './FreeCaseForm';

const SEEN_KEY = 'akta-popup-darmowa';
const HIDE_DAYS = 14;
/** Tu okienko nie wyskakuje (zakup, konto, sama darmowa sprawa, panel). */
const SKIP = /^\/(koszyk|zamowienie|konto|logowanie|rejestracja|nie-pamietam-hasla|admin|darmowa-sprawa|newsletter|n\/|qr|nagrania|online|dostep|opinia|regulamin|polityka|nota-prawna|zwroty)/;

/**
 * Okienko „Zanim wyjdziesz — darmowa sprawa” (zapis do newslettera).
 * Komputer: gdy kursor wyjeżdża w stronę zamknięcia karty. Telefon: po ok. 45 s czytania.
 * Najwyżej raz na 14 dni, nigdy w trakcie zakupu.
 */
export function FreeCasePopup({
  consentText,
  freeCase,
}: {
  consentText: string;
  freeCase: { number: string; title: string; cover: string; teaser: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const armed = useRef(false);

  useEffect(() => {
    if (!pathname || SKIP.test(pathname)) return;
    try {
      const seen = Number(window.localStorage.getItem(SEEN_KEY) ?? 0);
      if (seen && Date.now() - seen < HIDE_DAYS * 864e5) return;
    } catch {
      return; // bez pamięci przeglądarki nie pokazujemy (nie da się zapamiętać, że już było)
    }
    const show = () => {
      if (!armed.current) return;
      armed.current = false;
      setOpen(true);
      try {
        window.localStorage.setItem(SEEN_KEY, String(Date.now()));
      } catch {
        /* trudno */
      }
    };
    // Kilka sekund na rozejrzenie się, zanim okienko może się pojawić
    const arm = window.setTimeout(() => (armed.current = true), 8000);
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) show();
    };
    const touch = window.matchMedia('(hover: none)').matches;
    const mobile = touch ? window.setTimeout(show, 45000) : 0;
    document.addEventListener('mouseout', onLeave);
    return () => {
      window.clearTimeout(arm);
      window.clearTimeout(mobile);
      document.removeEventListener('mouseout', onLeave);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-950/75 p-3 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-darmowa"
        className="card relative max-h-[92vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={() => setOpen(false)} aria-label="Zamknij" className="absolute right-3 top-2 px-2 text-2xl leading-none text-muted hover:text-paper-50">
          ×
        </button>
        <div className="flex items-start gap-5">
          <div className="w-24 shrink-0 -rotate-3 sm:w-28">
            <CaseCover caseNumber={freeCase.number} title={freeCase.title} coverPath={freeCase.cover} />
          </div>
          <div>
            <p className="eyebrow">Zanim wyjdziesz</p>
            <h2 id="popup-darmowa" className="mt-1 text-2xl font-bold leading-tight">
              Weź jedną sprawę za darmo
            </h2>
            <p className="mt-2 text-sm text-paper-200">{freeCase.teaser}</p>
          </div>
        </div>
        <div className="mt-5">
          <FreeCaseForm source="popup" consentText={consentText} compact />
        </div>
        <button type="button" onClick={() => setOpen(false)} className="mt-3 w-full text-center text-xs text-muted hover:text-paper-200">
          Nie, dziękuję
        </button>
      </div>
    </div>
  );
}
