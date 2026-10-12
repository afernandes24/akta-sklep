'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { PL_VIEWBOX, VOIVODESHIPS } from '@/lib/geo-poland';

type Mode = 'buyers' | 'visitors';
interface Props {
  visitors: Record<string, number>;
  buyers: Record<string, number>;
  revenue: Record<string, number>;
  buyersAbroad: { label: string; value: number }[];
  buyersUnknown: number;
}

// Skala jednego koloru (mosiądz): im więcej, tym mocniej. 0 = tło.
const STEPS = [0.22, 0.4, 0.58, 0.78, 1];
const EMPTY = 'rgb(56 51 43)';
const fill = (v: number, max: number) => (v <= 0 ? EMPTY : `rgb(212 176 106 / ${STEPS[Math.min(4, Math.floor((v / max) * 4.999))]})`);

export function PolandMap({ visitors, buyers, revenue, buyersAbroad, buyersUnknown }: Props) {
  const [mode, setMode] = useState<Mode>('buyers');
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null);
  const data = mode === 'buyers' ? buyers : visitors;
  const max = Math.max(1, ...Object.values(data));
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  const ranked = VOIVODESHIPS.map((v) => ({ ...v, value: data[v.code] ?? 0 }))
    .filter((v) => v.value > 0)
    .sort((a, b) => b.value - a.value);
  const h = hover ? VOIVODESHIPS.find((v) => v.code === hover.code) : null;

  return (
    <section className="card p-5 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold">Mapa: skąd {mode === 'buyers' ? 'kupują' : 'odwiedzają'}</h2>
        <div className="flex gap-1 rounded-full border border-ink-700 p-1" role="tablist" aria-label="Co pokazać na mapie">
          {(
            [
              ['buyers', 'Kupujący'],
              ['visitors', 'Odwiedzający'],
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
          <svg viewBox={PL_VIEWBOX} className="h-auto w-full" role="img" aria-label={`Mapa województw — ${mode === 'buyers' ? 'kupujący' : 'odwiedzający'}`}>
            {VOIVODESHIPS.map((v) => {
              const val = data[v.code] ?? 0;
              return (
                <path
                  key={v.code}
                  d={v.d}
                  fill={fill(val, max)}
                  stroke="rgb(17 15 12)"
                  strokeWidth={hover?.code === v.code ? 3 : 1.5}
                  className="cursor-pointer transition-[fill]"
                  onMouseMove={(e) => {
                    const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHover({ code: v.code, x: e.clientX - box.left, y: e.clientY - box.top });
                  }}
                  onClick={(e) => {
                    const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHover({ code: v.code, x: e.clientX - box.left, y: e.clientY - box.top });
                  }}
                >
                  <title>{`${v.name}: ${val}`}</title>
                </path>
              );
            })}
          </svg>
          {h && hover && hover.x >= 0 && (
            <div
              className="pointer-events-none absolute z-10 min-w-[150px] rounded-md border border-ink-700 bg-ink-950/95 px-3 py-2 text-xs shadow-lg"
              style={{ left: hover.x + 12, top: hover.y + 12 }}
            >
              <p className="font-semibold text-paper-50">{h.name}</p>
              <p className="mt-1 text-paper-200">Kupujący: {buyers[h.code] ?? 0}</p>
              {(revenue[h.code] ?? 0) > 0 && <p className="text-paper-200">Przychód: {formatPrice(revenue[h.code])}</p>}
              <p className="text-paper-200">Odwiedzający: {visitors[h.code] ?? 0}</p>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted" aria-hidden>
            <span>mniej</span>
            {[EMPTY, ...STEPS.map((o) => `rgb(212 176 106 / ${o})`)].map((c) => (
              <span key={c} className="h-3 w-6 rounded-sm" style={{ background: c }} />
            ))}
            <span>więcej</span>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Województwa</p>
          {ranked.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Brak danych o województwach. Włącz w Cloudflare: Rules → Transform Rules → Managed Transforms → „Add visitor location headers”.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {ranked.map((v) => (
                <li key={v.code} className="flex justify-between gap-3" onMouseEnter={() => setHover({ code: v.code, x: -1, y: -1 })}>
                  <span className="text-paper-100">{v.name}</span>
                  <span className="font-mono text-paper-200">
                    {v.value} <span className="text-muted">· {Math.round((v.value / total) * 100)}%</span>
                  </span>
                </li>
              ))}
            </ul>
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
          {mode === 'buyers' && buyersUnknown > 0 && <p className="mt-4 text-xs text-muted">Bez ustalonej lokalizacji: {buyersUnknown} (np. zamówienia sprzed włączenia mapy).</p>}
        </div>
      </div>
    </section>
  );
}
