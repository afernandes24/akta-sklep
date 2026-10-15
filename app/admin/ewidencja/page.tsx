import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { seller } from '@/lib/legal/seller';
import { currentMonth, getLedgerMonth, getQuarterNet, isMonth, listLedgerMonths, monthLabel } from '@/lib/ledger';

const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

export default async function AdminLedgerPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await requireAdmin(); // każda strona panelu sprawdza uprawnienia sama
  const sp = await searchParams;
  const month = isMonth(sp.m) ? sp.m : currentMonth();

  let ledger;
  let months: string[] = [];
  let quarter = 0;
  try {
    [ledger, months, quarter] = await Promise.all([getLedgerMonth(month), listLedgerMonths(), getQuarterNet()]);
  } catch {
    return (
      <div>
        <h1 className="text-3xl font-bold">Ewidencja sprzedaży</h1>
        <p className="mt-4 text-stamp-500">
          Brak tabeli ewidencji w bazie. Uruchom plik <code>supabase/ewidencja.sql</code> w Supabase → SQL Editor.
        </p>
      </div>
    );
  }

  const limit = seller.businessType === 'nierejestrowana' ? seller.quarterlyRevenueLimitGrosze : 0;
  const share = limit ? Math.min(1, quarter / limit) : 0;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ewidencja sprzedaży</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Uzupełnia się sama: każda opłacona płatność zapisuje się w dniu zapłaty, a zwrot jako kwota ujemna w dniu zwrotu (czas polski). Na koniec miesiąca
            pobierz plik i zachowaj go przez 5 lat.
          </p>
        </div>
        <a href={`/admin/ewidencja/eksport?m=${month}`} className="btn-primary py-2">
          ↓ Pobierz {monthLabel(month)} (Excel)
        </a>
      </div>

      <nav className="mt-6 flex flex-wrap gap-1" aria-label="Miesiące">
        {months.map((m) => (
          <Link
            key={m}
            href={`/admin/ewidencja?m=${m}`}
            className={`rounded-md px-3 py-1.5 text-xs ${m === month ? 'bg-ink-700 text-paper-50' : 'text-paper-200 hover:bg-ink-800'}`}
          >
            {monthLabel(m)}
          </Link>
        ))}
      </nav>

      {limit > 0 && (
        <div className="card mt-6 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span>Przychód w bieżącym kwartale (limit działalności nierejestrowanej)</span>
            <span className="font-mono tabular-nums">
              {formatPrice(quarter)} / {formatPrice(limit)}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-800">
            <div className={`h-full ${share >= 0.8 ? 'bg-stamp-500' : 'bg-brass-400'}`} style={{ width: `${share * 100}%` }} />
          </div>
          {share >= 0.8 && <p className="mt-2 text-xs text-stamp-500">Zbliżasz się do limitu. Po jego przekroczeniu masz 7 dni na rejestrację działalności w CEIDG.</p>}
        </div>
      )}

      <div className="card mt-6 overflow-x-auto">
        <table className="table-admin min-w-[720px] tabular-nums">
          <thead>
            <tr>
              <th>Lp.</th>
              <th>Data</th>
              <th className="text-right">Sprzedaż</th>
              <th className="text-right">Zwroty</th>
              <th className="text-right">Przychód dnia</th>
              <th className="text-right">Narastająco w miesiącu</th>
              <th>Zamówienia</th>
            </tr>
          </thead>
          <tbody>
            {ledger.days.map((d) => (
              <tr key={d.date}>
                <td className="font-mono">{d.lp}</td>
                <td className="font-mono">{dayLabel(d.date)}</td>
                <td className="text-right">{formatPrice(d.salesGrosze)}</td>
                <td className={`text-right ${d.refundsGrosze ? 'text-stamp-500' : 'text-muted'}`}>{formatPrice(d.refundsGrosze)}</td>
                <td className="text-right font-semibold">{formatPrice(d.netGrosze)}</td>
                <td className="text-right">{formatPrice(d.cumulativeGrosze)}</td>
                <td className="font-mono text-xs text-muted">{d.orders.join(', ')}</td>
              </tr>
            ))}
            {ledger.days.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted">
                  Brak sprzedaży w tym miesiącu.
                </td>
              </tr>
            )}
          </tbody>
          {ledger.days.length > 0 && (
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={2}>Razem {monthLabel(month)}</td>
                <td className="text-right">{formatPrice(ledger.salesGrosze)}</td>
                <td className="text-right text-stamp-500">{formatPrice(ledger.refundsGrosze)}</td>
                <td className="text-right">{formatPrice(ledger.netGrosze)}</td>
                <td />
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Kwoty to ceny zapłacone przez klientów, przed prowizją Stripe. Prowizji nie odejmuje się od przychodu.</p>
    </div>
  );
}
