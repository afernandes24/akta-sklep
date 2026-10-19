import 'server-only';
import { createAdminClient } from './supabase/admin';
import { getAdmins, isAdminOrder } from './admins';

/** Wpisy z zamówień adminów (testy) nie są pokazywane ani eksportowane. */
async function withoutAdmins<T extends { orders?: unknown }>(rows: T[]): Promise<T[]> {
  const admins = await getAdmins();
  return rows.filter((r) => !isAdminOrder(r.orders as { user_id: string | null; email: string } | null, admins));
}

/**
 * UPROSZCZONA EWIDENCJA SPRZEDAŻY (działalność nierejestrowana).
 *
 * Każda opłacona płatność i każdy zwrot zapisuje się SAM w tabeli `sales_ledger`
 * (lib/orders.ts → fulfillOrder / refundOrder) z datą dnia w czasie polskim.
 * Wpisy się nie zmieniają — zwrot to osobny wpis z kwotą ujemną w dniu zwrotu.
 * Panel: Admin → Ewidencja (podgląd miesiąca + pobranie pliku).
 */

export type LedgerKind = 'sale' | 'refund';

export interface LedgerDay {
  lp: number;
  date: string; // YYYY-MM-DD
  salesGrosze: number;
  refundsGrosze: number; // wartość ujemna albo 0
  netGrosze: number;
  cumulativeGrosze: number; // narastająco od początku miesiąca
  orders: string[]; // np. ["12", "13", "zwrot 9"]
}

export interface LedgerMonth {
  month: string; // YYYY-MM
  days: LedgerDay[];
  salesGrosze: number;
  refundsGrosze: number;
  netGrosze: number;
}

const warsawDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Data dnia w czasie polskim, np. 2026-10-15. */
export function warsawDate(d: Date | string = new Date()): string {
  return warsawDay.format(typeof d === 'string' ? new Date(d) : d);
}

export function currentMonth(): string {
  return warsawDate().slice(0, 7);
}

export function isMonth(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}

/** Zapisuje wpis w ewidencji. Bezpieczne przy powtórzeniach (jeden wpis „sale” i jeden „refund” na zamówienie). */
export async function recordLedger(entry: { orderId: string; orderNumber: number | null; kind: LedgerKind; amountGrosze: number; at?: Date }) {
  const at = entry.at ?? new Date();
  const amount = entry.kind === 'refund' ? -Math.abs(entry.amountGrosze) : Math.abs(entry.amountGrosze);
  if (!amount) return;
  const { error } = await createAdminClient()
    .from('sales_ledger')
    .upsert(
      {
        order_id: entry.orderId,
        order_number: entry.orderNumber,
        kind: entry.kind,
        amount_grosze: amount,
        occurred_at: at.toISOString(),
        entry_date: warsawDate(at),
      },
      { onConflict: 'order_id,kind', ignoreDuplicates: true },
    );
  if (error) console.error('[ewidencja] zapis', error.message);
}

function lastDayOfMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const day = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month}-${String(day).padStart(2, '0')}`;
}

/** Ewidencja jednego miesiąca: jeden wiersz na każdy dzień ze sprzedażą lub zwrotem. */
export async function getLedgerMonth(month: string): Promise<LedgerMonth> {
  const { data, error } = await createAdminClient()
    .from('sales_ledger')
    .select('entry_date, kind, amount_grosze, order_number, occurred_at, orders(user_id, email)')
    .gte('entry_date', `${month}-01`)
    .lte('entry_date', lastDayOfMonth(month))
    .order('entry_date', { ascending: true })
    .order('occurred_at', { ascending: true });
  if (error) throw new Error(error.message);

  const byDay = new Map<string, LedgerDay>();
  for (const r of await withoutAdmins(data ?? [])) {
    const date = r.entry_date as string;
    const day = byDay.get(date) ?? { lp: 0, date, salesGrosze: 0, refundsGrosze: 0, netGrosze: 0, cumulativeGrosze: 0, orders: [] };
    const amount = r.amount_grosze as number;
    if (r.kind === 'refund') day.refundsGrosze += amount;
    else day.salesGrosze += amount;
    day.netGrosze += amount;
    if (r.order_number) day.orders.push(r.kind === 'refund' ? `zwrot ${r.order_number}` : String(r.order_number));
    byDay.set(date, day);
  }

  let cumulative = 0;
  const days = Array.from(byDay.values()).map((d, i) => {
    cumulative += d.netGrosze;
    return { ...d, lp: i + 1, cumulativeGrosze: cumulative };
  });
  return {
    month,
    days,
    salesGrosze: days.reduce((s, d) => s + d.salesGrosze, 0),
    refundsGrosze: days.reduce((s, d) => s + d.refundsGrosze, 0),
    netGrosze: cumulative,
  };
}

/** Miesiące od pierwszego wpisu do bieżącego (najnowszy pierwszy). */
export async function listLedgerMonths(): Promise<string[]> {
  const { data } = await createAdminClient().from('sales_ledger').select('entry_date').order('entry_date', { ascending: true }).limit(1);
  const now = currentMonth();
  const first = ((data?.[0]?.entry_date as string | undefined) ?? `${now}-01`).slice(0, 7);
  const out: string[] = [];
  let [y, m] = first.split('-').map(Number);
  for (let i = 0; i < 240; i++) {
    const v = `${y}-${String(m).padStart(2, '0')}`;
    out.push(v);
    if (v >= now) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out.reverse();
}

/** Przychód netto w bieżącym kwartale (do limitu działalności nierejestrowanej). */
export async function getQuarterNet(): Promise<number> {
  const today = warsawDate();
  const y = Number(today.slice(0, 4));
  const qStartMonth = Math.floor((Number(today.slice(5, 7)) - 1) / 3) * 3 + 1;
  const from = `${y}-${String(qStartMonth).padStart(2, '0')}-01`;
  const { data } = await createAdminClient().from('sales_ledger').select('amount_grosze, orders(user_id, email)').gte('entry_date', from).lte('entry_date', today);
  return (await withoutAdmins(data ?? [])).reduce((s, r) => s + (r.amount_grosze as number), 0);
}

const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Kwota w formacie do arkusza: „24,99”. */
export function plAmount(grosze: number): string {
  const sign = grosze < 0 ? '-' : '';
  const abs = Math.abs(grosze);
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}
