import Link from 'next/link';
import { PolandMap } from '@/components/admin/PolandMap';
import { requireAdmin } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { AutoRefresh } from '@/components/account/AutoRefresh';
import { ExcludeToggle } from '@/components/admin/ExcludeDevice';
import { getLive, getStats, type Row } from '@/lib/stats';

export const dynamic = 'force-dynamic';

const RANGES = [7, 30, 90];
const pct = (v: number) => `${(v * 100).toFixed(v > 0 && v < 0.1 ? 1 : 0)}%`;

function Bars({ title, rows, total, empty = 'Brak danych w tym okresie.' }: { title: string; rows: Row[]; total?: number; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const sum = total ?? rows.reduce((s, r) => s + r.value, 0);
  return (
    <section className="card p-5">
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <li key={r.label} title={`${r.label}: ${r.value} (${pct(sum ? r.value / sum : 0)})`}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate text-paper-100">{r.label}</span>
                <span className="shrink-0 font-mono text-paper-200">
                  {r.value} <span className="text-muted">· {pct(sum ? r.value / sum : 0)}</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-ink-800">
                <div className="h-full rounded-full bg-brass-400" style={{ width: `${(r.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AdminStatsPage({ searchParams }: { searchParams: Promise<{ dni?: string }> }) {
  await requireAdmin();
  const days = RANGES.includes(Number((await searchParams).dni)) ? Number((await searchParams).dni) : 30;
  const [s, live] = await Promise.all([getStats(days), getLive()]);
  const maxDay = Math.max(1, ...s.daily.map((d) => d.visitors));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Statystyki</h1>
          <p className="mt-1 text-sm text-muted">Bez adminów i ich zamówień (testów). Szczegółowe raporty: Google Analytics.</p>
        </div>
        <nav className="flex gap-2" aria-label="Okres">
          {RANGES.map((d) => (
            <Link key={d} href={`/admin/statystyki?dni=${d}`} className={`rounded-full border px-3 py-1.5 text-sm ${d === days ? 'border-brass-400 bg-brass-400 text-ink-950' : 'border-ink-700 text-paper-200'}`}>
              {d} dni
            </Link>
          ))}
        </nav>
      </div>

      {/* Odświeża się co 30 s, dopóki strona jest otwarta (do 2 godzin) */}
      <AutoRefresh intervalMs={30000} maxTries={240} />
      <ExcludeToggle />

      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold">Na żywo</h2>
          <span className="font-mono text-[11px] text-muted">odświeża się co 30 s</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ['Teraz w sklepie', String(live.activeNow), 'ostatnie 5 minut'],
            ['Dziś odwiedzających', String(live.todayVisitors), 'od północy'],
            ['Dziś wyświetleń', String(live.todayViews), 'wszystkie strony'],
          ].map(([label, value, hint]) => (
            <div key={label}>
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</p>
              <p className="mt-1 flex items-center gap-2 font-serif text-3xl font-bold text-paper-50">
                {label === 'Teraz w sklepie' && Number(value) > 0 && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />}
                {value}
              </p>
              <p className="text-xs text-muted">{hint}</p>
            </div>
          ))}
        </div>
      </section>

      {!s.ready && <p className="text-sm text-stamp-500">Brak tabeli statystyk — uruchom cały plik supabase/schema.sql w Supabase.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Odwiedzający', String(s.visitors)],
          ['Wyświetlenia stron', String(s.views)],
          ['Opłacone zamówienia', String(s.paidOrders)],
          ['Przychód', formatPrice(s.revenue)],
          ['Konwersja', pct(s.conversion)],
        ].map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</p>
            <p className="mt-2 font-serif text-3xl font-bold text-paper-50">{value}</p>
          </div>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="font-serif text-lg font-semibold">Odwiedzający dziennie</h2>
        <div className="mt-4 flex h-40 items-end gap-[2px]" role="img" aria-label="Wykres odwiedzających dziennie">
          {s.daily.map((d) => (
            <div key={d.date} className="group relative flex h-full flex-1 items-end" title={`${d.date}: ${d.visitors} odwiedzających${d.revenue ? `, ${formatPrice(d.revenue)}` : ''}`}>
              <div className="w-full rounded-t-[4px] bg-brass-400/80 group-hover:bg-brass-300" style={{ height: `${Math.max(d.visitors ? 3 : 0, (d.visitors / maxDay) * 100)}%` }} />
              {d.revenue > 0 && <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-400" aria-hidden />}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[11px] text-muted">
          <span>{s.daily[0]?.date}</span>
          <span>● = dzień ze sprzedażą</span>
          <span>{s.daily.at(-1)?.date}</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PolandMap {...s.map} />
        <Bars title="Skąd przychodzą" rows={s.sources} />
        <Bars title="Lejek zakupowy" rows={s.funnel} total={s.funnel[0]?.value} />
        <section className="card p-5">
          <h2 className="font-serif text-lg font-semibold">Sprawy: oglądali → kupili</h2>
          {s.cases.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Brak danych w tym okresie.</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-widest text-muted">
                  <th className="pb-2 font-normal">Sprawa</th>
                  <th className="pb-2 text-right font-normal">Oglądali</th>
                  <th className="pb-2 text-right font-normal">Kupili</th>
                  <th className="pb-2 text-right font-normal">Konw.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {s.cases.map((c) => (
                  <tr key={c.slug}>
                    <td className="py-2 pr-2 text-paper-100">{c.title}</td>
                    <td className="py-2 text-right font-mono">{c.views}</td>
                    <td className="py-2 text-right font-mono">{c.sold}</td>
                    <td className="py-2 text-right font-mono text-muted">{c.views ? pct(c.sold / c.views) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <Bars title="Urządzenia" rows={s.devices} />
        <Bars title="Kraje" rows={s.countries} />
        <Bars title="Kampanie (utm_campaign)" rows={s.campaigns} empty="Dodawaj do linków w reklamach np. ?utm_source=instagram&utm_campaign=start — zobaczysz tu, która kampania działa." />
        <Bars title="Kody rabatowe (opłacone)" rows={s.coupons} empty="Nikt jeszcze nie użył kodu w tym okresie." />
      </div>
      <p className="text-xs text-muted">
        Odwiedzający liczeni są osobno każdego dnia (bez cookies nie da się rozpoznać tej samej osoby następnego dnia). Dane starsze niż 13 miesięcy są usuwane.
      </p>
    </div>
  );
}
