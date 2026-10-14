'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GA_ID, OPEN_SETTINGS_EVENT, PIXEL_ID, readConsent, saveConsent, trackingConfigured } from '@/lib/consent';

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!trackingConfigured) return;
    const current = readConsent();
    if (!current) setOpen(true);
    else {
      setAnalytics(current.analytics);
      setMarketing(current.marketing);
    }
    const openSettings = () => {
      const c = readConsent();
      setAnalytics(c?.analytics ?? false);
      setMarketing(c?.marketing ?? false);
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, openSettings);
  }, []);

  if (!open) return null;

  const decide = (a: boolean, m: boolean) => {
    saveConsent({ analytics: a, marketing: m });
    setOpen(false);
    setDetails(false);
  };

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="cookie-title" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-xl border border-ink-600 bg-ink-900/98 p-5 shadow-2xl backdrop-blur">
        <h2 id="cookie-title" className="font-serif text-lg font-semibold">
          Pliki cookies
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-paper-200">
          Używamy niezbędnych plików cookies, żeby działało logowanie i koszyk.{' '}
          {PIXEL_ID
            ? 'Za twoją zgodą użyjemy też cookies analitycznych (Google Analytics) i marketingowych (Piksel Meta), żeby ulepszać sklep i mierzyć skuteczność reklam.'
            : 'Za twoją zgodą użyjemy też cookies analitycznych (Google Analytics), żeby ulepszać sklep.'}{' '}
          Szczegóły:{' '}
          <Link href="/polityka-cookies" className="text-brass-300 underline">
            polityka cookies
          </Link>
          .
        </p>

        {details && (
          <div className="mt-4 space-y-3 rounded-lg border border-ink-700 p-4 text-sm">
            <label className="flex items-start gap-3">
              <input type="checkbox" checked disabled className="mt-1 h-4 w-4 accent-brass-400" />
              <span>
                <span className="font-semibold text-paper-50">Niezbędne</span>
                <span className="block text-xs text-muted">Logowanie, koszyk, bezpieczeństwo. Zawsze aktywne.</span>
              </span>
            </label>
            {GA_ID && (
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1 h-4 w-4 accent-brass-400" />
                <span>
                  <span className="font-semibold text-paper-50">Analityczne</span>
                  <span className="block text-xs text-muted">Google Analytics — statystyki odwiedzin.</span>
                </span>
              </label>
            )}
            {PIXEL_ID && (
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1 h-4 w-4 accent-brass-400" />
                <span>
                  <span className="font-semibold text-paper-50">Marketingowe</span>
                  <span className="block text-xs text-muted">Piksel Meta — skuteczność reklam na Facebooku i Instagramie.</span>
                </span>
              </label>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {details ? (
            <button type="button" className="btn-secondary" onClick={() => decide(analytics, marketing)}>
              Zapisz wybór
            </button>
          ) : (
            <button type="button" className="btn-ghost" onClick={() => setDetails(true)}>
              Ustawienia
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={() => decide(false, false)}>
            Odrzuć opcjonalne
          </button>
          <button type="button" className="btn-primary" onClick={() => decide(Boolean(GA_ID), Boolean(PIXEL_ID))}>
            Akceptuję wszystkie
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsLink() {
  if (!trackingConfigured) return null;
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))} className="text-paper-200 transition hover:text-brass-300">
      Ustawienia cookies
    </button>
  );
}
