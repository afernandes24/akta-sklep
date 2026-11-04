import Link from 'next/link';
import { PolandMap } from '@/components/admin/PolandMap';
import { requireAdmin } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { AutoRefresh } from '@/components/account/AutoRefresh';
import { ExcludeToggle } from '@/components/admin/ExcludeDevice';
import { getLive, getStats, type Row, type ChannelRow, type AdRow } from '@/lib/stats';

export const dynamic = 'force-dynamic';

const RANGES = [1, 7, 30, 90, 365];
const RANGE_LABEL: Record<number, string> = { 1: 'Dziś', 7: '7 dni', 30: '30 dni', 90: '90 dni', 365: 'Rok' };
const WEEK = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'nd'];
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


const CH_COLOR: Record<string, string> = {
  'Meta Ads': 'bg-sky-400',
  'Google Ads': 'bg-amber-300',
  Facebook: 'bg-blue-500',
  Instagram: 'bg-pink-400',
  TikTok: 'bg-teal-300',
  Mail: 'bg-emerald-400',
  Wyszukiwarka: 'bg-yellow-200',
  'Inne strony': 'bg-violet-300',
  Bezpośrednio: 'bg-paper-200',
  Nieznane: 'bg-ink-600',
};
const Dot = ({ c }: { c: string }) => <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${CH_COLOR[c] ?? 'bg-ink-600'}`} aria-hidden />;

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1.5 font-serif text-2xl font-bold text-paper-50">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function ChannelTable({ rows }: { rows: ChannelRow[] }) {
  const total = rows.reduce((s, r) => s + r.revenue, 0);
  return (
    <section className="card p-5 lg:col-span-2">
      <h2 className="font-serif text-lg font-semibold">Kanały: skąd przychodzą i skąd kupują</h2>
      <p className="mt-1 text-xs text-muted">Każde zamówienie ma zapisane źródło wejścia (reklama, mail, Google…). Konwersja = zamówienia ÷ odwiedzający z danego kanału.</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Brak danych w tym okresie.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-widest text-muted">
                <th className="pb-2 font-normal">Kanał</th>
                <th className="pb-2 text-right font-normal">Odwiedzający</th>
                <th className="pb-2 text-right font-normal">Koszyk</th>
                <th className="pb-2 text-right font-normal">Zamówienia</th>
                <th className="pb-2 text-right font-normal">Przychód</th>
                <th className="pb-2 text-right font-normal">Konw.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {rows.map((r) => (
                <tr key={r.channel}>
                  <td className="py-2 pr-2">
                    <span className="flex items-center gap-2 text-paper-100">
                      <Dot c={r.channel} />
                      {r.channel}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono">{r.visitors}</td>
                  <td className="py-2 text-right font-mono">{r.carts}</td>
                  <td className="py-2 text-right font-mono font-semibold text-paper-50">{r.orders}</td>
                  <td className="py-2 text-right font-mono">
                    {formatPrice(r.revenue)} {total > 0 && <span className="text-muted">· {pct(r.revenue / total)}</span>}
                  </td>
                  <td className="py-2 text-right font-mono text-muted">{r.visitors ? pct(r.orders / r.visitors) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MetaCard({ meta }: { meta: { visitors: number; carts: number; orders: number; revenue: number; ads: AdRow[]; placements: Row[] } }) {
  return (
    <section className="card border-sky-400/30 p-5 lg:col-span-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
          <Dot c="Meta Ads" /> Reklamy Meta (Facebook / Instagram)
        </h2>
        <span className="text-xs text-muted">wydatki i kliknięcia: Menedżer reklam</span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        {[
          ['Weszli z reklam', String(meta.visitors)],
          ['Dodali do koszyka', String(meta.carts)],
          ['Kupili', String(meta.orders)],
          ['Przychód z reklam', formatPrice(meta.revenue)],
        ].map(([l, v]) => (
          <div key={l}>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{l}</p>
            <p className="mt-1 font-serif text-2xl font-bold text-paper-50">{v}</p>
          </div>
        ))}
      </div>
      {meta.ads.length > 0 ? (
        <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-widest text-muted">
                <th className="pb-2 font-normal">Reklama</th>
                <th className="pb-2 text-right font-normal">Weszli</th>
                <th className="pb-2 text-right font-normal">Koszyk</th>
                <th className="pb-2 text-right font-normal">Kupili</th>
                <th className="pb-2 text-right font-normal">Przychód</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {meta.ads.map((a) => (
                <tr key={a.label}>
                  <td className="py-2 pr-2 text-paper-100">{a.label}</td>
                  <td className="py-2 text-right font-mono">{a.visitors}</td>
                  <td className="py-2 text-right font-mono">{a.carts}</td>
                  <td className="py-2 text-right font-mono font-semibold text-paper-50">{a.orders}</td>
                  <td className="py-2 text-right font-mono">{formatPrice(a.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Gdzie kliknęli</p>
            {meta.placements.length ? (
              <ul className="mt-2 space-y-1.5 text-sm">
                {meta.placements.map((p) => (
                  <li key={p.label} className="flex justify-between">
                    <span className="text-paper-100">{p.label}</span>
                    <span className="font-mono text-paper-200">{p.value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted">—</p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Jeszcze nikt nie wszedł z reklamy w tym okresie (albo reklamy są w przeglądzie).</p>
      )}
    </section>
  );
}

function HourChart({ title, values, unit }: { title: string; values: number[]; unit: string }) {
  const max = Math.max(1, ...values);
  return (
    <section className="card p-5">
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      <div className="mt-4 flex h-28 items-end gap-[3px]">
        {values.map((v, h) => (
          <div key={h} className="flex h-full flex-1 items-end" title={`${h}:00–${h}:59 — ${v} ${unit}`}>
            <div className="w-full rounded-t-[3px] bg-brass-400/80" style={{ height: `${Math.max(v ? 4 : 0, (v / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
        <span>0</span>
        <span>6</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
    </section>
  );
}

function WeekChart({ visitors, orders }: { visitors: number[]; orders: number[] }) {
  const mv = Math.max(1, ...visitors);
  return (
    <section className="card p-5">
      <h2 className="font-serif text-lg font-semibold">Dni tygodnia</h2>
      <ul className="mt-4 space-y-2">
        {WEEK.map((d, i) => (
          <li key={d} className="grid grid-cols-[2.5rem_1fr_5.5rem] items-center gap-3 text-sm">
            <span className="text-paper-200">{d}</span>
            <div className="h-2 rounded-full bg-ink-800">
              <div className="h-full rounded-full bg-brass-400" style={{ width: `${(visitors[i] / mv) * 100}%` }} />
            </div>
            <span className="text-right font-mono text-xs text-paper-200">
              {visitors[i]} <span className="text-emerald-400">· {orders[i]} zam.</span>
            </span>
          </li>
        ))}
      </ul>
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
          <p className="mt-1 text-sm text-muted">
            Bez adminów, ich zamówień (testów) i botów{s.botsFiltered > 0 ? ` (pominięto ${s.botsFiltered} wejść z USA)` : ''}.
          </p>
        </div>
        <nav className="flex gap-2" aria-label="Okres">
          {RANGES.map((d) => (
            <Link key={d} href={`/admin/statystyki?dni=${d}`} className={`rounded-full border px-3 py-1.5 text-sm ${d === days ? 'border-brass-400 bg-brass-400 text-ink-950' : 'border-ink-700 text-paper-200'}`}>
              {RANGE_LABEL[d]}
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

      {!s.sourcesReady && s.ready && (
        <p className="text-sm text-stamp-500">Źródła zamówień zapisują się dopiero po uruchomieniu w Supabase pliku supabase/statystyki-zrodla.sql.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Odwiedzający" value={String(s.visitors)} hint={`${s.views} wyświetleń stron`} />
        <Kpi label="Opłacone zamówienia" value={String(s.paidOrders)} hint={`konwersja ${pct(s.conversion)}`} />
        <Kpi label="Przychód" value={formatPrice(s.revenue)} hint={s.paidOrders ? `średnio ${formatPrice(s.avgOrder)} / zamówienie` : undefined} />
        <Kpi label="Zaangażowanie" value={`${s.pagesPerVisitor.toFixed(1)} str.`} hint={`na osobę · ${pct(s.bounce)} wyszło po 1 stronie`} />
      </div>

      <section className="card p-5">
        <h2 className="font-serif text-lg font-semibold">Odwiedzający dziennie</h2>
        <div className="mt-4 flex h-40 items-end gap-[2px]" role="img" aria-label="Wykres odwiedzających dziennie">
          {s.daily.map((d) => (
            <div key={d.date} className="group relative flex h-full flex-1 items-end" title={`${d.date}: ${d.visitors} odwiedzających${d.orders ? `, ${d.orders} zam. · ${formatPrice(d.revenue)}` : ''}`}>
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
        <ChannelTable rows={s.channels} />
        <MetaCard meta={s.meta} />

        <section className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-lg font-semibold">Kupujący — skąd się wzięli</h2>
            <div className="flex flex-wrap gap-3 text-xs text-paper-200">
              {s.buyerChannels.map((c) => (
                <span key={c.label} className="flex items-center gap-1.5">
                  <Dot c={c.label} /> {c.label}: <strong className="text-paper-50">{c.value}</strong>
                </span>
              ))}
            </div>
          </div>
          {s.buyers.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Brak opłaconych zamówień w tym okresie.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="text-left font-mono text-[11px] uppercase tracking-widest text-muted">
                    <th className="pb-2 font-normal">Kiedy</th>
                    <th className="pb-2 font-normal">Kupujący</th>
                    <th className="pb-2 font-normal">Skąd</th>
                    <th className="pb-2 font-normal">Sprawy</th>
                    <th className="pb-2 font-normal">Miasto</th>
                    <th className="pb-2 text-right font-normal">Kwota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800">
                  {s.buyers.map((b, i) => (
                    <tr key={i} className="align-top">
                      <td className="whitespace-nowrap py-2 pr-3 font-mono text-xs text-paper-200">
                        {new Date(b.at).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs text-paper-200">{b.email}</td>
                      <td className="py-2 pr-3">
                        <span className="flex items-center gap-1.5 text-paper-100">
                          <Dot c={b.channel} /> {b.channel}
                        </span>
                        {(b.detail || b.code) && <span className="block text-xs text-muted">{[b.detail, b.code && `kod ${b.code}`].filter(Boolean).join(' · ')}</span>}
                      </td>
                      <td className="py-2 pr-3 text-xs text-paper-200">{b.cases.join(', ')}</td>
                      <td className="py-2 pr-3 text-xs text-paper-200">{b.city ?? '—'}</td>
                      <td className="py-2 text-right font-mono">{formatPrice(b.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted">„Nieznane” = zamówienia sprzed włączenia śledzenia źródeł albo osoba wróciła innego dnia z zakładki.</p>
        </section>

        <PolandMap {...s.map} />
        <Bars title="Skąd przychodzą (strony / utm_source)" rows={s.sources} />
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
        <Bars title="Strony wejścia (pierwsza odwiedzona)" rows={s.landing} />
        <HourChart title="Godziny wizyt" values={s.hours} unit="odwiedzających" />
        <HourChart title="Godziny zakupów" values={s.buyHours} unit="zamówień" />
        <WeekChart visitors={s.weekdays.visitors} orders={s.weekdays.orders} />
        <Bars title="Urządzenia" rows={s.devices} />
        <Bars title="Kraje" rows={s.countries} />
        <Bars title="Kampanie (utm_campaign)" rows={s.campaigns} empty="Linki w reklamach Meta i w mailach mają już utm_campaign — wejścia z nich pojawią się tutaj." />
        <Bars title="Kody rabatowe (opłacone)" rows={s.coupons} empty="Nikt jeszcze nie użył kodu w tym okresie." />
      </div>
      <p className="text-xs text-muted">
        Odwiedzający liczeni są osobno każdego dnia (bez cookies nie da się rozpoznać tej samej osoby następnego dnia). Dane starsze niż 13 miesięcy są usuwane.
      </p>
    </div>
  );
}
