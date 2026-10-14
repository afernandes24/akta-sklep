import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { buildEwidencja } from '@/lib/ewidencja';
import { formatPrice } from '@/lib/format';

export default async function AdminEwidencjaPage({ searchParams }: { searchParams: Promise<{ rok?: string }> }) {
  await requireAdmin(); // każda strona panelu sprawdza uprawnienia sama
  const sp = await searchParams;
  const y = Number(sp.rok);
  const year = Number.isInteger(y) && y > 2000 && y < 3000 ? y : new Date().getFullYear();
  const { rows, quarters, years } = await buildEwidencja(year);
  const total = rows.length ? rows[rows.length - 1].yearToDateGrosze : 0;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ewidencja sprzedaży</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Uzupełnia się sama z opłaconych zamówień (data zapłaty). Zwroty wchodzą na minusie w dniu zwrotu. Zamówienia z trybu testowego są pomijane.
          </p>
        </div>
        <a href={`/admin/ewidencja/csv?rok=${year}`} className="btn-primary whitespace-nowrap">
          ↓ Pobierz CSV ({year})
        </a>
      </div>

      {years.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-1">
          {years.map((yr) => (
            <Link
              key={yr}
              href={`/admin/ewidencja?rok=${yr}`}
              className={`rounded-md px-3 py-1.5 text-xs ${yr === year ? 'bg-ink-700 text-paper-50' : 'text-paper-200 hover:bg-ink-800'}`}
            >
              {yr}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {quarters.map((q) => (
          <div key={q.quarter} className={`card p-5 ${q.share >= 0.8 ? 'border-stamp-500/60' : ''}`}>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
              Kwartał {q.quarter} / {year}
            </p>
            <p className="mt-2 font-serif text-2xl font-bold text-paper-50">{formatPrice(q.netGrosze)}</p>
            {q.limitGrosze > 0 && (
              <p className={`mt-1 text-xs ${q.share >= 0.8 ? 'text-stamp-500' : 'text-muted'}`}>
                {Math.round(q.share * 100)}% limitu {formatPrice(q.limitGrosze)}
              </p>
            )}
          </div>
        ))}
        <div className="card p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Cały rok {year}</p>
          <p className="mt-2 font-serif text-2xl font-bold text-paper-50">{formatPrice(total)}</p>
          <p className="mt-1 text-xs text-muted">do PIT-36 (przychód)</p>
        </div>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="table-admin min-w-[820px]">
          <thead>
            <tr>
              <th>Lp.</th>
              <th>Data</th>
              <th>Nr zamówień</th>
              <th>Sprzedaż</th>
              <th>Zwroty</th>
              <th>Przychód dnia</th>
              <th>Narast. kwartał</th>
              <th>Narast. rok</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.date}>
                <td className="font-mono">{i + 1}</td>
                <td className="font-mono whitespace-nowrap">{r.date}</td>
                <td className="text-xs">
                  {r.orders.join(', ')}
                  {r.refundedOrders.length > 0 && <span className="block text-stamp-500">zwrot: {r.refundedOrders.join(', ')}</span>}
                </td>
                <td>{formatPrice(r.salesGrosze)}</td>
                <td className={r.refundsGrosze ? 'text-stamp-500' : 'text-muted'}>{r.refundsGrosze ? `−${formatPrice(r.refundsGrosze)}` : '—'}</td>
                <td className="font-semibold text-paper-50">{formatPrice(r.netGrosze)}</td>
                <td>{formatPrice(r.quarterToDateGrosze)}</td>
                <td>{formatPrice(r.yearToDateGrosze)}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-muted">
                  Brak sprzedaży w {year} r.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted">Raz w miesiącu pobierz CSV i zachowaj kopię u siebie (np. na Dysku Google).</p>
    </div>
  );
}
