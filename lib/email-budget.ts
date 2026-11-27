import 'server-only';
import { createAdminClient } from './supabase/admin';

/**
 * LIMIT RESEND — pilnuje, żeby maile marketingowe nie zjadły limitu (darmowy plan: 100/dzień, 3000/miesiąc).
 *
 *  • order     — pliki po zakupie, karta podarunkowa: zawsze idą, aż do twardego limitu dnia.
 *  • system    — potwierdzenie zapisu, darmowa sprawa, odpowiedzi na wiadomości, powiadomienia dla Ciebie:
 *                idą, dopóki zostaje REZERWA na zakupy (domyślnie 5).
 *  • marketing — newsletter, seria powitalna, kampanie, maile po zakupie: równomiernie, najwyżej X na godzinę,
 *                i tylko gdy po nich dalej zostaje rezerwa na zakupy oraz zapas na resztę miesiąca.
 *
 * Każdy wysłany mail jest zapisywany w tabeli email_log (supabase/limit-maili.sql). Bez tej tabeli
 * licznik nie działa i maile idą jak dawniej.
 *
 * Zmienne w Railway (opcjonalne): RESEND_DAILY_LIMIT (100), RESEND_MONTHLY_LIMIT (3000),
 * EMAIL_RESERVE (5), EMAIL_MARKETING_PER_HOUR (domyślnie wyliczane, ok. 3).
 */
export type EmailKind = 'order' | 'system' | 'marketing';

const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);
export const LIMITS = {
  daily: num(process.env.RESEND_DAILY_LIMIT, 100),
  monthly: num(process.env.RESEND_MONTHLY_LIMIT, 3000),
  reserve: num(process.env.EMAIL_RESERVE, 5),
  /** zapas na maile systemowe (zapisy, wiadomości) — nie wydawany na marketing */
  systemBuffer: 15,
  get perHour() {
    return num(process.env.EMAIL_MARKETING_PER_HOUR, Math.max(1, Math.floor((this.daily - this.reserve - this.systemBuffer) / 24)));
  },
};

const H = 36e5;
let tableMissing = false;
/** Resend odpowiedział „limit” (429) — do tej chwili nie wysyłamy nic poza zakupami */
let blockedUntil = 0;

export type Usage = { day: number; month: number; marketingHour: number; ready: boolean };

export async function getUsage(): Promise<Usage> {
  if (tableMissing) return { day: 0, month: 0, marketingHour: 0, ready: false };
  const db = createAdminClient();
  const now = Date.now();
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  const q = () => db.from('email_log').select('id', { count: 'exact', head: true }).eq('ok', true);
  const [d, m, h] = await Promise.all([
    q().gte('created_at', new Date(now - 24 * H).toISOString()),
    q().gte('created_at', monthStart),
    q().eq('kind', 'marketing').gte('created_at', new Date(now - H).toISOString()),
  ]);
  if (d.error) {
    if (/email_log/.test(d.error.message)) tableMissing = true;
    return { day: 0, month: 0, marketingHour: 0, ready: false };
  }
  return { day: d.count ?? 0, month: m.count ?? 0, marketingHour: h.count ?? 0, ready: true };
}

function daysLeftInMonth() {
  const n = new Date();
  const end = Date.UTC(n.getUTCFullYear(), n.getUTCMonth() + 1, 1);
  return Math.max(1, Math.ceil((end - n.getTime()) / (24 * H)));
}

/** Ile maili marketingowych można wysłać TERAZ (0 = poczekaj). */
export async function marketingAllowance(): Promise<number> {
  if (Date.now() < blockedUntil) return 0;
  const u = await getUsage();
  if (!u.ready) return 40; // bez tabeli — jak dawniej (paczkami)
  const L = LIMITS;
  const byDay = L.daily - L.reserve - L.systemBuffer - u.day;
  const byHour = L.perHour - u.marketingHour;
  // na każdy pozostały dzień miesiąca zostaw rezerwę + zapas systemowy
  const byMonth = L.monthly - u.month - daysLeftInMonth() * (L.reserve + L.systemBuffer);
  return Math.max(0, Math.min(byDay, byHour, byMonth));
}

/** Czy wolno wysłać mail danego rodzaju. */
export async function canSend(kind: EmailKind): Promise<boolean> {
  if (kind === 'marketing') return (await marketingAllowance()) > 0;
  const u = await getUsage();
  if (!u.ready) return true;
  if (kind === 'order') return u.day < LIMITS.daily && u.month < LIMITS.monthly;
  if (Date.now() < blockedUntil) return false;
  return u.day < LIMITS.daily - LIMITS.reserve && u.month < LIMITS.monthly - LIMITS.reserve;
}

export async function logSend(kind: EmailKind, ok: boolean, status?: number) {
  if (status === 429) blockedUntil = Date.now() + H;
  if (tableMissing) return;
  const { error } = await createAdminClient().from('email_log').insert({ kind, ok, status: status ?? null });
  if (error && /email_log/.test(error.message)) tableMissing = true;
}
