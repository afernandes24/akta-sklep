'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { PL_VIEWBOX, VOIVODESHIPS } from '@/lib/geo-poland';

type Mode = 'buyers' | 'visitors';
interface CityPoint {
  name: string;
  lat: number | null;
  lon: number | null;
  value: number;
  revenue: number;
}
interface Props {
  visitors: Record<string, number>;
  buyers: Record<string, number>;
  revenue: Record<string, number>;
  buyersAbroad: { label: string; value: number }[];
  buyersUnknown: number;
  cityVisitors: CityPoint[];
  cityBuyers: CityPoint[];
}

// Ta sama projekcja (Mercator), z której powstały granice województw w lib/geo-poland.ts
const K = 3338.43;
const LON0 = 14.1229;
const MERC = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const MERC_TOP = MERC(54.8358);
const project = (lat: number, lon: number) => ({ x: 8 + K * (((lon - LON0) * Math.PI) / 180), y: 8.3 + K * (MERC_TOP - MERC(lat)) });

const STEPS = [0.1, 0.18, 0.26, 0.34, 0.42];
const EMPTY = 'rgb(56 51 43)';
const fill = (v: number, max: number) => (v <= 0 ? EMPTY : `rgb(212 176 106 / ${STEPS[Math.min(4, Math.floor((v / max) * 4.999))]})`);

type Hover = { kind: 'city'; name: string; x: number; y: number } | { kind: 'region'; code: string; x: number; y: number };

export function PolandMap({ visitors, buyers, revenue, buyersAbroad, buyersUnknown, cityVisitors, cityBuyers }: Props) {
  const [mode, setMode] = useState<Mode>('visitors');
  const [hover, setHover] = useState<Hover | null>(null);
  const [showAll, setShowAll] = useState(false);
  const regions = mode === 'buyers' ? buyers : visitors;
  const cities = mode === 'buyers' ? cityBuyers : cityVisitors;
  const maxRegion = Math.max(1, ...Object.values(regions));
  const maxCity = Math.max(1, ...cities.map((c) => c.value));
  const totalCity = cities.reduce((s, c) => s + c.value, 0);
  const points = cities
    .filter((c) => c.lat != null && c.lon != null && c.lat > 48.9 && c.lat < 55 && c.lon > 14 && c.lon < 24.3)
    .map((c) => ({ ...c, ...project(c.lat!, c.lon!), r: 3.5 + 13 * Math.sqrt(c.value / maxCity) }))
    .sort((a, b) => b.r - a.r); // małe kropki na wierzchu
  const regionRanked = VOIVODESHIPS.map((v) => ({ ...v, value: regions[v.code] ?? 0 }))
    .filter((v) => v.value > 0)
    .sort((a, b) => b.value - a.value);
  const pos = (e: React.MouseEvent<SVGElement>) => {
    const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };
  const hc = hover?.kind === 'city' ? cities.find((c) => c.name === hover.name) : null;
  const hr = hover?.kind === 'region' ? VOIVODESHIPS.find((v) => v.code === hover.code) : null;
  const listed = showAll ? cities : cities.slice(0, 12);

  return (
    <section className="card p-5 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold">Mapa: skąd {mode === 'buyers' ? 'kupują' : 'odwiedzają'}</h2>
        <div className="flex gap-1 rounded-full border border-ink-700 p-1" role="tablist" aria-label="Co pokazać na mapie">
          {(
            [
              ['visitors', 'Odwiedzający'],
              ['buyers', 'Kupujący'],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-xs ${mode === m ? 'bg-brass-400 text-ink-950' : 'text-paper-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="relative" onMouseLeave={() => setHover(null)}>
          <svg viewBox={PL_VIEWBOX} className="h-auto w-full" role="img" aria-label={`Mapa miast — ${mode === 'buyers' ? 'kupujący' : 'odwiedzający'}`}>
            {VOIVODESHIPS.map((v) => (
              <path
                key={v.code}
                d={v.d}
                fill={fill(regions[v.code] ?? 0, maxRegion)}
                stroke="rgb(17 15 12)"
                strokeWidth={hover?.kind === 'region' && hover.code === v.code ? 3 : 1.5}
                onMouseMove={(e) => setHover({ kind: 'region', code: v.code, ...pos(e) })}
                onClick={(e) => setHover({ kind: 'region', code: v.code, ...pos(e) })}
              />
            ))}
            {points.map((c) => (
              <circle
                key={c.name}
                cx={c.x}
                cy={c.y}
                r={c.r}
                fill={mode === 'buyers' ? 'rgb(52 211 153 / 0.75)' : 'rgb(232 196 120 / 0.8)'}
                stroke={hover?.kind === 'city' && hover.name === c.name ? 'white' : 'rgb(17 15 12)'}
                strokeWidth={1.5}
                className="cursor-pointer"
                onMouseMove={(e) => setHover({ kind: 'city', name: c.name, ...pos(e) })}
                onClick={(e) => setHover({ kind: 'city', name: c.name, ...pos(e) })}
              >
                <title>{`${c.name}: ${c.value}`}</title>
              </circle>
            ))}
          </svg>
          {hover && hover.x >= 0 && (hc || hr) && (
            <div
              className="pointer-events-none absolute z-10 min-w-[150px] rounded-md border border-ink-700 bg-ink-950/95 px-3 py-2 text-xs shadow-lg"
              style={{ left: hover.x + 12, top: hover.y + 12 }}
            >
              {hc ? (
                <>
                  <p className="font-semibold text-paper-50">{hc.name}</p>
                  <p className="mt-1 text-paper-200">
                    {mode === 'buyers' ? 'Kupujący' : 'Odwiedzający'}: {hc.value}
                  </p>
                  {mode === 'buyers' && hc.revenue > 0 && <p className="text-paper-200">Przychód: {formatPrice(hc.revenue)}</p>}
                </>
              ) : (
                hr && (
                  <>
                    <p className="font-semibold text-paper-50">woj. {hr.name}</p>
                    <p className="mt-1 text-paper-200">Odwiedzający: {visitors[hr.code] ?? 0}</p>
                    <p className="text-paper-200">Kupujący: {buyers[hr.code] ?? 0}</p>
                    {(revenue[hr.code] ?? 0) > 0 && <p className="text-paper-200">Przychód: {formatPrice(revenue[hr.code])}</p>}
                  </>
                )
              )}
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted">Kropka = miasto (im większa, tym więcej osób). Lokalizacja z adresu IP — przybliżona.</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Miasta</p>
          {cities.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Brak danych o miastach. Włącz w Cloudflare: Rules → Transform Rules → Managed Transforms → „Add visitor location headers”.
            </p>
          ) : (
            <>
              <ul className="mt-2 space-y-1.5 text-sm">
                {listed.map((c) => (
                  <li key={c.name} className="flex justify-between gap-3" onMouseEnter={() => setHover({ kind: 'city', name: c.name, x: -1, y: -1 })}>
                    <span className="truncate text-paper-100">{c.name}</span>
                    <span className="shrink-0 font-mono text-paper-200">
                      {c.value} <span className="text-muted">· {Math.round((c.value / totalCity) * 100)}%</span>
                    </span>
                  </li>
                ))}
              </ul>
              {cities.length > 12 && (
                <button type="button" onClick={() => setShowAll(!showAll)} className="mt-2 text-xs text-brass-300 hover:underline">
                  {showAll ? 'Pokaż mniej' : `Pokaż wszystkie (${cities.length})`}
                </button>
              )}
            </>
          )}

          {regionRanked.length > 0 && (
            <details className="mt-5">
              <summary className="cursor-pointer text-xs uppercase tracking-widest text-muted">Województwa</summary>
              <ul className="mt-2 space-y-1.5 text-sm">
                {regionRanked.map((v) => (
                  <li key={v.code} className="flex justify-between gap-3">
                    <span className="text-paper-100">{v.name}</span>
                    <span className="font-mono text-paper-200">{v.value}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {mode === 'buyers' && buyersAbroad.length > 0 && (
            <>
              <p className="mt-5 text-xs uppercase tracking-widest text-muted">Spoza Polski</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {buyersAbroad.map((r) => (
                  <li key={r.label} className="flex justify-between gap-3">
                    <span className="text-paper-100">{r.label}</span>
                    <span className="font-mono text-paper-200">{r.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {mode === 'buyers' && buyersUnknown > 0 && <p className="mt-4 text-xs text-muted">Bez ustalonej lokalizacji: {buyersUnknown}.</p>}
        </div>
      </div>
    </section>
  );
}
