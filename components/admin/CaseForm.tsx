'use client';

import { useActionState, useState } from 'react';
import { type SaveCaseState, saveCase } from '@/app/admin/actions';
import { Notice } from '@/components/ui/PageHeader';
import { slugify } from '@/lib/format';
import { CASE_TAGS } from '@/lib/tags';
import type { CaseRecord } from '@/lib/types';
import { ExcerptsEditor } from './ExcerptsEditor';

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
                  {'★'.repeat(n)} ({n})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Czas gry (min)">
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
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="font-serif text-xl font-semibold">Treści na stronie produktu</h2>
        <fieldset>
          <legend className="label">Tematy (filtry w katalogu)</legend>
          <div className="flex flex-wrap gap-3">
            {CASE_TAGS.map((t) => (
              <label key={t.id} className="flex items-center gap-2 rounded-md border border-ink-700 px-3 py-2 text-sm text-paper-200">
                <input type="checkbox" name="tags" value={t.id} defaultChecked={c?.tags?.includes(t.id)} className="h-4 w-4 accent-brass-400" />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Czego można się spodziewać" hint="Jedna pozycja w linii.">
          <textarea name="highlights" className="input" rows={5} defaultValue={c?.highlights.join('\n') ?? ''} />
        </Field>
        <Field label="Co otrzymasz (lista plików)" hint='Jedna pozycja w linii, np. „02_AKTA_SPRAWY.pdf — raporty i przesłuchania”.'>
          <textarea name="contents" className="input font-mono" rows={5} defaultValue={c?.contents.join('\n') ?? ''} />
        </Field>
        <div>
          <span className="label">Przykładowe fragmenty akt</span>
          <ExcerptsEditor initial={c?.excerpts ?? []} />
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="font-serif text-xl font-semibold">SEO</h2>
        <Field label="Tytuł SEO" hint="Zostaw puste, aby użyć domyślnego. Najlepiej do 60 znaków.">
          <input name="seo_title" className="input" defaultValue={c?.seo_title ?? ''} maxLength={120} />
        </Field>
        <Field label="Opis meta (description)" hint="Najlepiej 140–160 znaków.">
          <textarea name="seo_description" className="input" rows={3} defaultValue={c?.seo_description ?? ''} maxLength={300} />
        </Field>
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
