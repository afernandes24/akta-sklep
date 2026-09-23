'use client';

import { useState } from 'react';
import type { Excerpt, ExcerptType } from '@/lib/types';

const types: { value: ExcerptType; label: string }[] = [
  { value: 'raport', label: 'Raport / dokument' },
  { value: 'przesluchanie', label: 'Protokół przesłuchania' },
  { value: 'notatka', label: 'Notatka odręczna' },
  { value: 'wiadomosc', label: 'Wiadomości SMS (każda linia = dymek)' },
  { value: 'wycinek', label: 'Wycinek z gazety' },
];

export function ExcerptsEditor({ initial }: { initial: Excerpt[] }) {
  const [items, setItems] = useState<Excerpt[]>(initial);

  const update = (i: number, patch: Partial<Excerpt>) => setItems((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="space-y-4">
      <input type="hidden" name="excerpts" value={JSON.stringify(items)} />
      {items.map((e, i) => (
        <fieldset key={i} className="rounded-lg border border-ink-700 bg-ink-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="font-mono text-xs uppercase tracking-widest text-muted">Fragment {i + 1}</legend>
            <div className="flex gap-1">
              <button type="button" className="btn-ghost min-h-0 py-1 text-xs" onClick={() => move(i, -1)} aria-label="Przesuń wyżej">
                ↑
              </button>
              <button type="button" className="btn-ghost min-h-0 py-1 text-xs" onClick={() => move(i, 1)} aria-label="Przesuń niżej">
                ↓
              </button>
              <button type="button" className="btn-ghost min-h-0 py-1 text-xs text-stamp-500" onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))}>
                Usuń
              </button>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Rodzaj</label>
              <select className="input" value={e.type} onChange={(ev) => update(i, { type: ev.target.value as ExcerptType })}>
                {types.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tytuł</label>
              <input className="input" value={e.title} onChange={(ev) => update(i, { title: ev.target.value })} />
            </div>
            <div>
              <label className="label">Podtytuł / nagłówek (opcjonalnie)</label>
              <input className="input" value={e.meta ?? ''} onChange={(ev) => update(i, { meta: ev.target.value })} />
            </div>
            <div>
              <label className="label">Pieczątka (opcjonalnie)</label>
              <input className="input" value={e.stamp ?? ''} onChange={(ev) => update(i, { stamp: ev.target.value })} placeholder="np. Poufne" />
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Treść</label>
            <textarea className="input font-mono" rows={5} value={e.body} onChange={(ev) => update(i, { body: ev.target.value })} />
          </div>
        </fieldset>
      ))}
      <button type="button" className="btn-secondary" onClick={() => setItems((p) => [...p, { type: 'raport', title: '', body: '' }])}>
        + Dodaj fragment
      </button>
      <p className="text-xs text-muted">Fragmenty pokazujemy na stronie produktu. Upewnij się, że nie zdradzają sprawcy.</p>
    </div>
  );
}
