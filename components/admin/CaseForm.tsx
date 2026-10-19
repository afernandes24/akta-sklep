'use client';

import { useActionState, useState } from 'react';
import { type SaveCaseState, saveCase } from '@/app/admin/actions';
import { Notice } from '@/components/ui/PageHeader';
import { slugify } from '@/lib/format';
import { LEVEL_NAMES } from '@/lib/tags';
import type { CaseRecord } from '@/lib/types';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function CaseForm({ c }: { c?: CaseRecord }) {
  const [state, action, pending] = useActionState<SaveCaseState, FormData>(saveCase, {});
  const [title, setTitle] = useState(c?.title ?? '');
  const [slug, setSlug] = useState(c?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(c));

  return (
    <form action={action} className="space-y-8">
      {c && <input type="hidden" name="id" value={c.id} />}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">Zapisano zmiany. Strona sklepu odświeży się w ciągu minuty.</Notice>}

      <section className="card space-y-5 p-6">
        <h2 className="font-serif text-xl font-semibold">Podstawowe informacje</h2>
        <div className="grid gap-5 sm:grid-cols-[120px_1fr]">
          <Field label="Numer akt">
            <input name="case_number" className="input font-mono" defaultValue={c?.case_number ?? ''} placeholder="002" required />
          </Field>
          <Field label="Tytuł">
            <input
              name="title"
              className="input"
              value={title}
              required
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </Field>
        </div>
        <Field label="Adres URL" hint={`Strona produktu: /sprawy/${slug || '…'}`}>
          <input
            name="slug"
            className="input font-mono"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </Field>
        <Field label="Krótki opis (na kartę produktu)">
          <textarea name="tagline" className="input" rows={2} defaultValue={c?.tagline ?? ''} maxLength={240} />
        </Field>
        <Field label="Opis fabuły" hint="Akapity oddziel pustą linią.">
          <textarea name="description" className="input" rows={8} defaultValue={c?.description ?? ''} />
        </Field>
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="font-serif text-xl font-semibold">Cena i parametry</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Cena (zł)">
            <input name="price" className="input" inputMode="decimal" defaultValue={c ? (c.price_grosze / 100).toFixed(2).replace('.', ',') : '24,99'} required />
          </Field>
          <Field label="Trudność (1–5)">
            <select name="difficulty" className="input" defaultValue={c?.difficulty ?? 3}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {'💀'.repeat(n)} ({n} — {LEVEL_NAMES[n]})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Czas gry (min)" hint="Średnia, np. 165 dla 2–3,5 h">
            <input name="play_time_minutes" type="number" min={1} className="input" defaultValue={c?.play_time_minutes ?? 90} />
          </Field>
          <Field label="Liczba stron">
            <input name="page_count" type="number" min={0} className="input" defaultValue={c?.page_count ?? 0} />
          </Field>
          <Field label="Liczba podejrzanych">
            <input name="suspect_count" type="number" min={0} className="input" defaultValue={c?.suspect_count ?? 5} />
          </Field>
          <Field label="Kolejność w katalogu" hint="Mniejsza liczba = wyżej">
            <input name="sort_order" type="number" className="input" defaultValue={c?.sort_order ?? 0} />
          </Field>
        </div>
        <div className="grid gap-5 border-t border-ink-800 pt-5 sm:grid-cols-3">
          <label className="flex items-center gap-3 text-sm text-paper-200 sm:col-span-2">
            <input type="checkbox" name="online_enabled" defaultChecked={c?.online_enabled ?? false} className="h-5 w-5 accent-brass-400" />
            <span>
              <strong className="text-paper-50">Sprzedawaj wersję online</strong>
              <span className="block text-xs text-muted">Włącz, gdy wersja online jest wygenerowana i opublikowana (sekcja „Wersja online” obok).</span>
            </span>
          </label>
          <Field label="Cena wersji online (zł)" hint="Puste = jak PDF">
            <input name="online_price" className="input" inputMode="decimal" defaultValue={c?.online_price_grosze != null ? (c.online_price_grosze / 100).toFixed(2).replace('.', ',') : ''} />
          </Field>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-4 border-t border-ink-700 bg-ink-950/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={c?.is_published ?? false} className="h-5 w-5 accent-brass-400" />
          <span>
            <span className="font-semibold text-paper-50">Opublikowana</span>
            <span className="block text-xs text-muted">Widoczna w sklepie i możliwa do kupienia</span>
          </span>
        </label>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Zapisywanie…' : c ? 'Zapisz zmiany' : 'Utwórz sprawę'}
        </button>
      </div>
    </form>
  );
}
