import { seller } from '@/lib/legal/seller';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Uproszczona ewidencja sprzedaży (działalność nierejestrowana) liczona automatycznie z zamówień.
 * Sprzedaż = data zapłaty (paid_at), zwrot = data zwrotu (refunded_at) jako kwota ujemna.
 * Pomijane: tryb testowy (provider = 'mock'), płatności testowe Stripe (sk_test) i gratisy (is_test).
 */

export type EwidencjaRow = {
  date: string; // RRRR-MM-DD (czas polski)
  orders: number[]; // numery zamówień sprzedanych tego dnia
  refundedOrders: number[]; // numery zamówień zwróconych tego dnia
  salesGrosze: number;
  refundsGrosze: number; // dodatnia liczba, odejmowana od sprzedaży
  netGrosze: number;
  yearToDateGrosze: number;
  quarterToDateGrosze: number;
  quarter: number;
};

export type QuarterSummary = { quarter: number; netGrosze: number; limitGrosze: number; share: number };

type OrderRow = {
  order_number: number;
  total_grosze: number;
  provider: string;
  status: string;
  paid_at: string | null;
  refunded_at?: string | null;
  updated_at?: string | null;
  is_test?: boolean | null;
};

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' });
export const warsawDay = (iso: string) => dayFmt.format(new Date(iso)); // "2026-10-14"
const quarterOf = (day: string) => Math.floor((Number(day.slice(5, 7)) - 1) / 3) + 1;

async function fetchOrders(): Promise<OrderRow[]> {
  const db = createAdminClient();
  const all: OrderRow[] = [];
  for (let from = 0; ; from += 1000) {
    // select('*'), żeby strona działała także przed dodaniem kolumny refunded_at
    const { data, error } = await db.from('orders').select('*').not('paid_at', 'is', null).order('paid_at').range(from, from + 999);
    if (error) throw new Error(error.message);
    all.push(...((data ?? []) as OrderRow[]));
    if (!data || data.length < 1000) break;
  }
  return all.filter((o) => o.provider !== 'mock' && !o.is_test);
}

export async function buildEwidencja(year: number): Promise<{ rows: EwidencjaRow[]; quarters: QuarterSummary[]; years: number[] }> {
  const orders = await fetchOrders();
  const days = new Map<string, EwidencjaRow>();
  const years = new Set<number>([new Date().getFullYear()]);
  const get = (d: string) => {
    let r = days.get(d);
    if (!r) {
      r = { date: d, orders: [], refundedOrders: [], salesGrosze: 0, refundsGrosze: 0, netGrosze: 0, yearToDateGrosze: 0, quarterToDateGrosze: 0, quarter: quarterOf(d) };
      days.set(d, r);
    }
    return r;
  };

  for (const o of orders) {
    if (o.status !== 'paid' && o.status !== 'refunded') continue;
    const paidDay = warsawDay(o.paid_at as string);
    years.add(Number(paidDay.slice(0, 4)));
    if (paidDay.startsWith(`${year}-`)) {
      const r = get(paidDay);
      r.orders.push(o.order_number);
      r.salesGrosze += o.total_grosze;
    }
    if (o.status === 'refunded') {
      const when = o.refunded_at ?? o.updated_at ?? o.paid_at;
      const refundDay = warsawDay(when as string);
      years.add(Number(refundDay.slice(0, 4)));
      if (refundDay.startsWith(`${year}-`)) {
        const r = get(refundDay);
        r.refundedOrders.push(o.order_number);
        r.refundsGrosze += o.total_grosze;
      }
    }
  }

  const rows = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  let ytd = 0;
  let qtd = 0;
  let q = 0;
  const qNet = [0, 0, 0, 0];
  for (const r of rows) {
    if (r.quarter !== q) {
      q = r.quarter;
      qtd = 0;
    }
    r.netGrosze = r.salesGrosze - r.refundsGrosze;
    ytd += r.netGrosze;
    qtd += r.netGrosze;
    r.yearToDateGrosze = ytd;
    r.quarterToDateGrosze = qtd;
    qNet[r.quarter - 1] += r.netGrosze;
  }
  const limit = seller.quarterlyRevenueLimitGrosze;
  const quarters = qNet.map((net, i) => ({ quarter: i + 1, netGrosze: net, limitGrosze: limit, share: limit ? net / limit : 0 }));
  return { rows, quarters, years: [...years].sort((a, b) => b - a) };
}

const zl = (g: number) => (g / 100).toFixed(2).replace('.', ',');

/** CSV pod polskiego Excela: średniki, przecinek dziesiętny, BOM. */
export function ewidencjaCsv(rows: EwidencjaRow[]): string {
  const head = ['Lp.', 'Data', 'Nr zamówień', 'Sprzedaż (zł)', 'Zwroty (zł)', 'Przychód dnia (zł)', 'Narastająco w kwartale (zł)', 'Narastająco od początku roku (zł)', 'Uwagi'];
  const lines = rows.map((r, i) =>
    [
      String(i + 1),
      r.date,
      r.orders.join(', '),
      zl(r.salesGrosze),
      r.refundsGrosze ? `-${zl(r.refundsGrosze)}` : '0,00',
      zl(r.netGrosze),
      zl(r.quarterToDateGrosze),
      zl(r.yearToDateGrosze),
      r.refundedOrders.length ? `zwrot zam. ${r.refundedOrders.join(', ')}` : '',
    ]
      .map((c) => (/[;"\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c))
      .join(';'),
  );
  return '﻿' + [head.join(';'), ...lines].join('\r\n');
}
