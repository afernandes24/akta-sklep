'use client';

import { useEffect, useMemo, useState } from 'react';
import { CASE_TAGS, CITY_SECTION, LEVEL_NAMES } from '@/lib/tags';
import { plural } from '@/lib/format';
import type { CaseRating, CaseRecord } from '@/lib/types';
import { CaseCard, ComingSoonCard } from './CaseCard';
import { Skulls } from './Skull';

const LEVELS = [1, 2, 3, 4, 5].map((n) => ({ id: String(n), stars: n, name: LEVEL_NAMES[n] }));
const EXTRAS = [
  { id: 'nagrania', label: '🎧 Z nagraniami przesłuchań', test: (c: CaseRecord) => (c.recordings_count ?? 0) > 0 },
  { id: 'online', label: '💻 Wersja online', test: (c: CaseRecord) => Boolean(c.online_enabled) },
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

type Filters = { temat: string; miasto: string; poziom: string; czas: string; extra: string; sort: string };
const EMPTY: Filters = { temat: '', miasto: '', poziom: '', czas: '', extra: '', sort: '' };
const KEYS = Object.keys(EMPTY) as (keyof Filters)[];

function Chip({ active, onClick, title, children }: { active: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
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
    const next = { ...EMPTY };
    KEYS.forEach((k) => (next[k] = sp.get(k) ?? ''));
    if (!/^[1-5]$/.test(next.poziom)) next.poziom = '';
    setF(next);
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
  const cities = useMemo(
    () => Array.from(new Set(cases.map((c) => c.city?.trim()).filter((x): x is string => Boolean(x)))).sort((a, b) => a.localeCompare(b, 'pl')),
    [cases],
  );
  const usedLevels = useMemo(() => LEVELS.filter((l) => cases.some((c) => c.difficulty === l.stars)), [cases]);
  const usedExtras = useMemo(() => EXTRAS.filter((e) => cases.some(e.test)), [cases]);

  const visible = useMemo(() => {
    const tm = TIMES.find((t) => t.id === f.czas)?.test;
    const ex = EXTRAS.find((e) => e.id === f.extra)?.test;
    const inSection = (c: CaseRecord) =>
      !f.temat || (f.temat === CITY_SECTION.id ? Boolean(c.city) && (!f.miasto || c.city === f.miasto) : c.tags?.includes(f.temat));
    const list = cases.filter(
      (c) => inSection(c) && (!f.poziom || c.difficulty === Number(f.poziom)) && (!tm || tm(c.play_time_minutes)) && (!ex || ex(c)),
    );
    const sorted = [...list];
    if (f.sort === 'cena') sorted.sort((a, b) => a.price_grosze - b.price_grosze);
    if (f.sort === 'latwe') sorted.sort((a, b) => a.difficulty - b.difficulty);
    if (f.sort === 'trudne') sorted.sort((a, b) => b.difficulty - a.difficulty);
    if (f.sort === 'oceny') sorted.sort((a, b) => (ratings[b.id]?.avg ?? 0) - (ratings[a.id]?.avg ?? 0));
    return sorted;
  }, [cases, f, ratings]);

  const active = f.temat || f.poziom || f.czas || f.extra;

  return (
    <>
      <div className="card mb-8 space-y-4 p-5" role="search" aria-label="Filtry spraw">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <span className="w-20 shrink-0 pt-2 text-xs uppercase tracking-widest text-muted">Dział</span>
          <div className="flex flex-wrap gap-2">
            <Chip active={!f.temat} onClick={() => update({ temat: '', miasto: '' })}>
              Wszystkie
            </Chip>
            {usedTags.map((t) => (
              <Chip key={t.id} active={f.temat === t.id} title={t.hint} onClick={() => update({ temat: f.temat === t.id ? '' : t.id, miasto: '' })}>
                {t.label}
              </Chip>
            ))}
            {cities.length > 0 && (
              <Chip active={f.temat === CITY_SECTION.id} title={CITY_SECTION.hint} onClick={() => update({ temat: f.temat === CITY_SECTION.id ? '' : CITY_SECTION.id, miasto: '' })}>
                📍 {CITY_SECTION.label}
              </Chip>
            )}
          </div>
        </div>
        {f.temat === CITY_SECTION.id && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <span className="w-20 shrink-0 pt-2 text-xs uppercase tracking-widest text-muted">Miasto</span>
            <div className="flex flex-wrap gap-2">
              <Chip active={!f.miasto} onClick={() => update({ miasto: '' })}>
                Cała Polska
              </Chip>
              {cities.map((city) => (
                <Chip key={city} active={f.miasto === city} onClick={() => update({ miasto: f.miasto === city ? '' : city })}>
                  {city}
                </Chip>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <span className="w-20 shrink-0 pt-2 text-xs uppercase tracking-widest text-muted">Poziom</span>
          <div className="flex flex-wrap gap-2">
            <Chip active={!f.poziom} onClick={() => update({ poziom: '' })}>
              Każdy
            </Chip>
            {usedLevels.map((l) => (
              <Chip key={l.id} active={f.poziom === l.id} title={`Trudność ${l.stars} z 5`} onClick={() => update({ poziom: f.poziom === l.id ? '' : l.id })}>
                <span aria-hidden className="inline-flex items-center gap-1.5">
                  <Skulls value={l.stars} max={l.stars} activeClass={f.poziom === l.id ? 'text-ink-950' : 'text-brass-400'} />
                  {l.name}
                </span>
                <span className="sr-only">{l.name}</span>
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
        {usedExtras.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="w-20 shrink-0 text-xs uppercase tracking-widest text-muted">Dodatki</span>
            <div className="flex flex-wrap gap-2">
              {usedExtras.map((e) => (
                <Chip key={e.id} active={f.extra === e.id} onClick={() => update({ extra: f.extra === e.id ? '' : e.id })}>
                  {e.label}
                </Chip>
              ))}
            </div>
          </div>
        )}
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
