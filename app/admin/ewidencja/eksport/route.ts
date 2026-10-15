import { NextResponse } from 'next/server';
import { isAdminUser } from '@/lib/online';
import { getUser } from '@/lib/auth';
import { sellerIdentity } from '@/lib/legal/seller';
import { currentMonth, getLedgerMonth, isMonth, monthLabel, plAmount } from '@/lib/ledger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Plik CSV dla Excela (średniki, przecinek dziesiętny, polskie znaki) — jeden miesiąc ewidencji. */
export async function GET(req: Request) {
  const user = await getUser();
  if (!user || !(await isAdminUser(user.id))) return new NextResponse('Brak dostępu', { status: 403 });

  const m = new URL(req.url).searchParams.get('m');
  const month = isMonth(m) ? m : currentMonth();
  const ledger = await getLedgerMonth(month);

  const cell = (v: string | number) => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const line = (...cols: (string | number)[]) => cols.map(cell).join(';');
  const dayLabel = (iso: string) => iso.split('-').reverse().join('.');

  const rows = [
    line('UPROSZCZONA EWIDENCJA SPRZEDAŻY'),
    line(`Sprzedawca: ${sellerIdentity()}`),
    line(`Okres: ${monthLabel(month)}`),
    '',
    line('Lp.', 'Data', 'Sprzedaż (zł)', 'Zwroty (zł)', 'Przychód dnia (zł)', 'Przychód narastająco od początku miesiąca (zł)', 'Numery zamówień'),
    ...ledger.days.map((d) =>
      line(d.lp, dayLabel(d.date), plAmount(d.salesGrosze), plAmount(d.refundsGrosze), plAmount(d.netGrosze), plAmount(d.cumulativeGrosze), d.orders.join(', ')),
    ),
    line('', 'RAZEM', plAmount(ledger.salesGrosze), plAmount(ledger.refundsGrosze), plAmount(ledger.netGrosze), '', ''),
  ];
  if (ledger.days.length === 0) rows.splice(5, 0, line('', 'Brak sprzedaży w tym miesiącu'));

  return new NextResponse('﻿' + rows.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ewidencja-sprzedazy-${month}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
