'use client';

import { useEffect, useMemo, useState } from 'react';
import { CASE_TAGS } from '@/lib/tags';
import { plural } from '@/lib/format';
import type { CaseRating, CaseRecord } from '@/lib/types';
import { CaseCard, ComingSoonCard } from './CaseCard';

const LEVELS = [
  { id: '', label: 'Każdy' },
  { id: 'latwe', label: 'Łatwe (1–2)', test: (d: number) => d <= 2 },
  { id: 'srednie', label: 'Średnie (3)', test: (d: number) => d === 3 },
  { id: 'trudne', label: 'Trudne (4–5)', test: (d: number) => d >= 4 },
];
const TIMES = [
  { id: '', label: 'Dowolny' },
  { id: 'krotkie', label: 'do 75 min', test: (m: number) => m <= 75 },
  { id: 'srednie', label: '76–100 min', test: (m: number) => m > 75 && m <= 100 },
  { id: 'dlugie', label: 'ponad 100 min', test: (m: number) => m > 100 },
];
const SORTS = [
  { id: '', label: 'Polecane' },
  { id: 'cena', label: 'Cena: od najniższej' },
  { id: 'latwe', label: 'Od najłatwiejszych' },
  { id: 'trudne', label: 'Od najtrudniejszych' },
  { id: 'oceny', label: 'Najlepiej oceniane' },
];

type Filters = { temat: string; poziom: string; czas: string; sort: string };
const EMPTY: Filters = { temat: '', poziom: '', czas: '', sort: '' };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active ? 'border-brass-400 bg-brass-400 text-ink-950' : 'border-ink-700 text-paper-200 hover:border-brass-500/60 hover:text-paper-50'
      }`}
    >
      {children}
    </button>
  );
}

export function CatalogBrowser({ cases, ratings }: { cases: CaseRecord[]; ratings: Record<string, CaseRating> }) {
  const [f, setF] = useState<Filters>(EMPTY);

  // Filtry w adresie (?temat=katastrofa) — można podlinkować wynik; strona statyczna pokazuje wszystko dla SEO.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setF({ temat: sp.get('temat') ?? '', poziom: sp.get('poziom') ?? '', czas: sp.get('czas') ?? '', sort: sp.get('sort') ?? '' });
  }, []);

  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    setF(next);
    const sp = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && sp.set(k, v));
    const qs = sp.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  };

  const usedTags = useMemo(() => CASE_TAGS.filter((t) => cases.some((c) => c.tags?.includes(t.id))), [cases]);

  const visible = useMemo(() => {
    const lvl = LEVELS.find((l) => l.id === f.poziom)?.test;
    const tm = TIMES.find((t) => t.id === f.czas)?.test;
    const list = cases.filter(
      (c) => (!f.temat || c.tags?.includes(f.temat)) && (!lvl || lvl(c.difficulty)) && (!tm || tm(c.play_time_minutes)),
    );
    const sorted = [...list];
    if (f.sort === 'cena') sorted.sort((a, b) => a.price_grosze - b.price_grosze);
    if (f.sort === 'latwe') sorted.sort((a, b) => a.difficulty - b.difficulty);
    if (f.sort === 'trudne') sorted.sort((a, b) => b.difficulty - a.difficulty);
    if (f.sort === 'oceny') sorted.sort((a, b) => (ratings[b.id]?.avg ?? 0) - (ratings[a.id]?.avg ?? 0));
    return sorted;
  }, [cases, f, ratings]);

  const active = f.temat || f.poziom || f.czas;

  return (
    <>
      <div className="card mb-8 space-y-4 p-5" role="search" aria-label="Filtry spraw">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="w-20 shrink-0 text-xs uppercase tracking-widest text-muted">Temat</span>
          <div className="flex flex-wrap gap-2">
            <Chip active={!f.temat} onClick={() => update({ temat: '' })}>
              Wszystkie
            </Chip>
            {usedTags.map((t) => (
              <Chip key={t.id} active={f.temat === t.id} onClick={() => update({ temat: f.temat === t.id ? '' : t.id })}>
                {t.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="w-20 shrink-0 text-xs uppercase tracking-widest text-muted">Poziom</span>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <Chip key={l.id || 'all'} active={f.poziom === l.id} onClick={() => update({ poziom: l.id })}>
                {l.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="w-20 shrink-0 text-xs uppercase tracking-widest text-muted">Czas gry</span>
          <div className="flex flex-wrap gap-2">
            {TIMES.map((t) => (
              <Chip key={t.id || 'all'} active={f.czas === t.id} onClick={() => update({ czas: t.id })}>
                {t.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-ink-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-paper-200" aria-live="polite">
            {visible.length} {plural(visible.length, 'sprawa', 'sprawy', 'spraw')}
            {active && (
              <button type="button" onClick={() => update({ ...EMPTY, sort: f.sort })} className="ml-3 text-brass-300 underline underline-offset-2">
                Wyczyść filtry
              </button>
            )}
          </p>
          <label className="flex items-center gap-2 text-sm text-paper-200">
            Sortuj:
            <select value={f.sort} onChange={(e) => update({ sort: e.target.value })} className="input w-auto py-1.5">
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-paper-200">Żadna sprawa nie pasuje do wybranych filtrów.</p>
          <button type="button" onClick={() => update(EMPTY)} className="btn-secondary mt-4">
            Pokaż wszystkie
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c, i) => (
            <CaseCard key={c.id} c={c} priority={i < 2} rating={ratings[c.id]} />
          ))}
          {!active && <ComingSoonCard />}
        </div>
      )}
    </>
  );
}
