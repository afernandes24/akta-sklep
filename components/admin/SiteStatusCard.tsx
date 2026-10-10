'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { saveSiteSettings, setSiteOpen, type SiteSettingsState } from '@/app/admin/extra-actions';

export interface SiteSettingsView {
  is_open: boolean;
  headline: string;
  message: string;
  launch_label: string | null;
  has_password: boolean;
}

export function SiteStatusCard({ s, missingTable }: { s: SiteSettingsView; missingTable: boolean }) {
  const [state, action, pending] = useActionState<SiteSettingsState, FormData>(saveSiteSettings, {});
  return (
    <section className={`card p-6 ${s.is_open ? '' : 'border-brass-500/60'}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-semibold">Status sklepu</h2>
          <p className="mt-1 text-sm">
            {s.is_open ? (
              <span className="text-emerald-300">● Otwarty — widzą go wszyscy</span>
            ) : (
              <span className="text-brass-300">● Zamknięty — goście widzą stronę „Wkrótce start”{s.has_password ? ', wejście na hasło' : ''}</span>
            )}
          </p>
        </div>
        <form action={setSiteOpen}>
          <input type="hidden" name="open" value={s.is_open ? 'false' : 'true'} />
          <button className={s.is_open ? 'btn-secondary' : 'btn-primary'} disabled={missingTable}>
            {s.is_open ? 'Zamknij sklep' : 'Otwórz sklep dla wszystkich'}
          </button>
        </form>
      </div>
      {missingTable && <p className="mt-3 text-sm text-stamp-500">Brak tabeli ustawień — uruchom cały plik supabase/schema.sql w Supabase (SQL Editor).</p>}

      <details className="mt-5 rounded-lg border border-ink-700">
        <summary className="cursor-pointer px-4 py-3 text-sm text-paper-100">Treść strony „Wkrótce” i hasło dostępu</summary>
        <form action={action} className="space-y-4 border-t border-ink-800 p-4">
          <label className="block">
            <span className="label">Nagłówek</span>
            <input name="headline" defaultValue={s.headline} className="input" maxLength={120} required />
          </label>
          <label className="block">
            <span className="label">Opis</span>
            <textarea name="message" defaultValue={s.message} className="input" rows={3} maxLength={1000} required />
          </label>
          <label className="block">
            <span className="label">Data startu (opcjonalnie, np. „1 listopada”)</span>
            <input name="launch_label" defaultValue={s.launch_label ?? ''} className="input" maxLength={60} />
          </label>
          <label className="block">
            <span className="label">{s.has_password ? 'Nowe hasło dostępu (puste = bez zmian)' : 'Hasło dostępu (puste = brak wejścia na hasło)'}</span>
            <input name="password" type="text" autoComplete="off" className="input" minLength={6} placeholder="min. 6 znaków" />
          </label>
          {s.has_password && (
            <label className="flex items-center gap-2 text-sm text-paper-200">
              <input type="checkbox" name="remove_password" className="accent-stamp-500" /> Wyłącz wejście na hasło
            </label>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary" disabled={pending}>
              {pending ? 'Zapisuję…' : 'Zapisz'}
            </button>
            <Link href="/wkrotce?podglad=1" target="_blank" className="text-sm text-brass-300 hover:underline">
              Podgląd strony „Wkrótce” ↗
            </Link>
          </div>
          {state.error && <p className="text-sm text-stamp-500">{state.error}</p>}
          {state.ok && <p className="text-sm text-emerald-300">{state.ok}</p>}
          <p className="text-xs text-muted">
            Jako zalogowany admin zawsze widzisz cały sklep. Osoby z hasłem wpisują je raz — dostęp pamięta przeglądarka przez 30 dni. Zmiana hasła wylogowuje wszystkich z podglądu. Zmiany działają w ciągu ok. 20 sekund.
          </p>
        </form>
      </details>
    </section>
  );
}
