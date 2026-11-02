import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { getAdmins, isAdminOrder } from './admins';
import { publicStorageUrl, siteConfig } from './config';
import { sendEmail } from './email';
import { formatPrice } from './format';
import { sellerIdentity } from './legal/seller';
import { createAdminClient } from './supabase/admin';

/**
 * MAIL PO ZAKUPIE: podziękowanie + prośba o opinię (link bez logowania)
 * + kod rabatowy i polecane sprawy — TYLKO dla osób ze zgodą na newsletter
 * (informacja handlowa e-mailem wymaga zgody — art. 398 Prawa komunikacji elektronicznej).
 */

const secret = () => process.env.REVIEW_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev';
export const reviewToken = (email: string) => createHmac('sha256', secret()).update(`opinia:${email.toLowerCase()}`).digest('hex').slice(0, 32);
export function checkReviewToken(email: string, token: string): boolean {
  const a = Buffer.from(reviewToken(email)); const b = Buffer.from(String(token));
  return a.length === b.length && timingSafeEqual(a, b);
}
export const reviewUrl = (email: string, extra = '') =>
  `${siteConfig.url}/opinia?e=${encodeURIComponent(email.toLowerCase())}&k=${reviewToken(email)}${extra}`;

export interface Buyer {
  email: string;
  orderIds: string[];
  sentAt: string | null; // kiedy ostatnio wysłano mail po zakupie
  pendingOrderIds: string[]; // zamówienia bez wysłanego maila
  cases: { id: string; slug: string; title: string }[];
  lastPaidAt: string;
  consentToken: string | null; // token newslettera = zgoda marketingowa
}

type OrderRow = {
  id: string; email: string; user_id: string | null; paid_at: string | null; followup_sent_at?: string | null;
  order_items: { case_id: string | null; cases: { id: string; slug: string; title: string } | null }[];
};

/** Kupujący pogrupowani po e-mailu (opłacone zamówienia, bez zwrotów i bez kont adminów). */
export async function getBuyers(opts: { includeAdmins?: boolean } = {}): Promise<{ buyers: Buyer[]; ready: boolean }> {
  const db = createAdminClient();
  const cols = 'id, email, user_id, paid_at, order_items(case_id, cases(id, slug, title))';
  let res = await db.from('orders').select(`${cols}, followup_sent_at`).eq('status', 'paid').order('paid_at', { ascending: true }).limit(5000);
  const ready = !res.error;
  if (res.error) res = (await db.from('orders').select(cols).eq('status', 'paid').order('paid_at', { ascending: true }).limit(5000)) as typeof res;
  const [admins, subs] = await Promise.all([
    getAdmins(),
    db.from('newsletter_subscribers').select('email, token').eq('status', 'confirmed').limit(50000),
  ]);
  const consent = new Map((subs.data ?? []).map((s) => [String(s.email).toLowerCase(), String(s.token)]));
  const map = new Map<string, Buyer>();
  for (const o of (res.data ?? []) as unknown as OrderRow[]) {
    if (!opts.includeAdmins && isAdminOrder(o, admins)) continue;
    const email = o.email.toLowerCase();
    const b = map.get(email) ?? { email, orderIds: [], sentAt: null, pendingOrderIds: [], cases: [], lastPaidAt: o.paid_at ?? '', consentToken: consent.get(email) ?? null };
    b.orderIds.push(o.id);
    if (!o.followup_sent_at) b.pendingOrderIds.push(o.id);
    else if (!b.sentAt || o.followup_sent_at > b.sentAt) b.sentAt = o.followup_sent_at;
    if (o.paid_at && o.paid_at > b.lastPaidAt) b.lastPaidAt = o.paid_at;
    for (const it of o.order_items ?? []) if (it.cases && !b.cases.some((c) => c.id === it.cases!.id)) b.cases.push(it.cases);
    map.set(email, b);
  }
  return { buyers: [...map.values()], ready };
}

export interface Promo {
  code: string;
  label: string; // np. „20% taniej” albo „druga sprawa −50%”
  until: string | null; // np. „16 listopada”
}

/** Kod rabatowy do maila — tylko aktywny i ważny. */
export async function loadPromo(code: string): Promise<Promo | null> {
  if (!code) return null;
  const { data } = await createAdminClient().from('discount_codes').select('*').eq('code', code.toUpperCase()).maybeSingle();
  if (!data?.is_active || (data.valid_until && new Date(data.valid_until) < new Date())) return null;
  const label = data.second_percent_off
    ? `druga sprawa −${data.second_percent_off}%`
    : data.percent_off
      ? `${data.percent_off}% taniej`
      : `${formatPrice(data.amount_off_grosze ?? 0)} taniej`;
  const until = data.valid_until
    ? new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' }).format(new Date(data.valid_until))
    : null;
  return { code: data.code, label, until };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export type Rec = { slug: string; title: string; tagline: string; price_grosze: number; cover_path: string | null; case_number: string };

/** Podpis pod mailem (pierwsza osoba — mail od twórcy, nie od „firmy”). */
const SIGNATURE = process.env.FOLLOWUP_SIGNATURE || 'Aleksander';

/** „Pusty grób”, „Pusty grób” i „Czarna taśma”, „A”, „B” i „C” */
function titlesPl(titles: string[]): string {
  const q = titles.map((t) => `„${esc(t)}”`);
  return q.length <= 1 ? (q[0] ?? 'naszą sprawę') : `${q.slice(0, -1).join(', ')} i ${q[q.length - 1]}`;
}

export function followupHtml(b: Buyer, promo: Promo | null, recs: Rec[]): { subject: string; html: string } {
  const main = b.cases[0];
  const one = b.cases.length <= 1;
  const titles = titlesPl(b.cases.map((c) => c.title));
  const P = (t: string) => `<p style="font-size:16px;line-height:1.65;margin:0 0 16px">${t}</p>`;
  const stars = [1, 2, 3, 4, 5]
    .map((n) => `<a href="${reviewUrl(b.email, `&ocena=${n}${main ? `&s=${main.slug}` : ''}`)}" style="text-decoration:none;font-size:36px;color:#c9a227;padding:0 4px" title="${n} z 5">★</a>`)
    .join('');
  const withPromo = Boolean(promo && b.consentToken);
  const q = withPromo ? `?kod=${encodeURIComponent(promo!.code)}` : '';
  const recCells = recs
    .map((r) => {
      const img = publicStorageUrl('covers', r.cover_path);
      const src = img ? (img.startsWith('http') ? img : siteConfig.url + img) : null;
      return `<td style="width:33%;padding:6px;vertical-align:top;text-align:center">
        <a href="${siteConfig.url}/sprawy/${r.slug}${q}" style="text-decoration:none;color:#1c1a17">
          ${src ? `<img src="${esc(src)}" alt="${esc(r.title)}" width="150" style="width:100%;max-width:150px;border-radius:6px;display:block;margin:0 auto 8px">` : ''}
          <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#8a6d33">AKTA #${esc(r.case_number)}</div>
          <div style="font-size:15px;font-weight:bold;margin-top:2px;line-height:1.25">${esc(r.title)}</div>
          <div style="font-family:Arial,sans-serif;font-size:13px;color:#666;margin-top:4px">${formatPrice(r.price_grosze)}</div>
        </a></td>`;
    })
    .join('');

  const promoHtml = withPromo
    ? `<div style="margin:30px 0 8px;padding:26px 22px;background:#1c1a17;border-radius:10px;text-align:center;color:#f4efe3">
        <p style="font-family:'Courier New',monospace;letter-spacing:3px;font-size:11px;color:#d4b06a;margin:0;text-transform:uppercase">Podziękowanie ode mnie</p>
        <p style="font-size:24px;font-weight:bold;margin:10px 0 6px">Kolejna sprawa ${esc(promo!.label)}</p>
        <p style="font-family:Arial,sans-serif;font-size:14px;color:#cfc6b3;margin:0 0 16px">Wpisz kod w koszyku${promo!.until ? ` — ważny do ${esc(promo!.until)}` : ''}</p>
        <div style="display:inline-block;border:2px dashed #d4b06a;padding:10px 22px;font-family:'Courier New',monospace;font-size:24px;letter-spacing:4px;color:#d4b06a;font-weight:bold">${esc(promo!.code)}</div>
        <p style="margin:20px 0 0"><a href="${siteConfig.url}/sprawy${q}" style="background:#d4b06a;color:#1c1a17;padding:12px 24px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;display:inline-block">Wybierz kolejną sprawę</a></p>
      </div>
      ${recs.length ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#666;margin:22px 0 6px;text-align:center">Tych spraw jeszcze nie masz:</p><table role="presentation" style="width:100%;border-collapse:collapse"><tr>${recCells}</tr></table>` : ''}
      <p style="font-family:Arial,sans-serif;font-size:13px;color:#666;margin:16px 0 0;text-align:center">Kod możesz śmiało podesłać znajomemu, który lubi kryminały 🙂</p>`
    : '';

  const footer = b.consentToken
    ? `Dostajesz tę wiadomość, bo kupiłeś(-aś) sprawę w sklepie ${esc(siteConfig.name)} i zapisałeś(-aś) się do newslettera. <a href="${siteConfig.url}/newsletter/wypisz?token=${encodeURIComponent(b.consentToken)}" style="color:#888">Wypisz się</a>.`
    : `To jednorazowa wiadomość po zakupie w sklepie ${esc(siteConfig.name)} — nie zapisałem cię do żadnej listy mailingowej.`;

  const html = `<!doctype html><html lang="pl"><head><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#efe8d8;font-family:Georgia,serif;color:#1c1a17">
<div style="display:none;max-height:0;overflow:hidden">Krótkie podziękowanie i jedna prośba${withPromo ? ' — plus kod na kolejną sprawę' : ''}.</div>
<div style="max-width:600px;margin:0 auto;padding:28px 14px">
  <p style="text-align:center;font-family:'Courier New',monospace;letter-spacing:4px;font-size:12px;color:#8a6d33;text-transform:uppercase;margin:0 0 14px">🔍 ${esc(siteConfig.name)}</p>
  <div style="background:#fbf8f1;border:1px solid #e0d6bf;border-radius:12px;padding:30px 26px;box-shadow:0 2px 0 #e0d6bf">
    <h1 style="font-size:26px;margin:0 0 18px">Cześć, detektywie!</h1>
    ${P(`Z tej strony ${esc(SIGNATURE)} — to ja piszę sprawy w Aktach Detektywa. Chciałem po prostu podziękować, że ${one ? 'wybrałeś(-aś)' : 'wybrałeś(-aś) aż'} ${titles}. Każdą sprawę wymyślam i sprawdzam sam, więc świadomość, że ktoś siedzi nad nią wieczorem i szuka winnego, naprawdę mnie cieszy.`)}
    ${P(`Mam jedną prośbę: jeśli już ${one ? 'rozwiązałeś(-aś) sprawę' : 'coś rozwiązałeś(-aś)'}, napisz mi, jak było. Każda opinia pomaga mi pisać lepsze sprawy, a innym graczom wybrać tę właściwą.`)}
    <div style="margin:6px 0 22px;padding:20px;background:#ffffff;border:1px solid #e9e1cd;border-radius:10px;text-align:center">
      <p style="font-size:18px;font-weight:bold;margin:0 0 4px">Jak ${one ? 'oceniasz sprawę' : 'oceniasz moje sprawy'}?</p>
      <p style="font-family:Arial,sans-serif;font-size:13px;color:#777;margin:0 0 8px">Kliknij gwiazdkę — zajmie to minutę, bez logowania.</p>
      <div>${stars}</div>
      <p style="margin:12px 0 0"><a href="${reviewUrl(b.email, main ? `&s=${main.slug}` : '')}" style="font-family:Arial,sans-serif;font-size:14px;color:#8a6d33">Napisz kilka słów →</a></p>
    </div>
    ${P('A jeśli coś nie zagrało albo utknąłeś(-aś) na którymś celu — po prostu odpisz na tego maila. Czytam wszystko sam i chętnie pomogę.')}
    ${promoHtml}
    <p style="font-size:16px;line-height:1.6;margin:26px 0 0">Dzięki jeszcze raz i powodzenia w kolejnych śledztwach!</p>
    <p style="font-size:16px;line-height:1.5;margin:14px 0 0"><span style="font-size:20px;font-style:italic">${esc(SIGNATURE)}</span><br><span style="color:#777;font-size:14px">twórca Akt Detektywa, Gdynia</span></p>
  </div>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#8f877a;line-height:1.5;margin:18px 6px 0;text-align:center">${footer}<br>${esc(sellerIdentity())}</p>
</div></body></html>`;
  const subject = one && main ? `Dzięki za „${main.title}” — mała prośba ode mnie` : 'Dzięki za zakupy w Aktach Detektywa — mała prośba ode mnie';
  return { subject, html };
}

/** Polecane sprawy: opublikowane, których kupujący nie ma (max 3). */
export function recommendationsFor(b: Buyer, all: Rec[]): Rec[] {
  const owned = new Set(b.cases.map((c) => c.slug));
  return all.filter((r) => !owned.has(r.slug)).slice(0, 3);
}

/**
 * Wysyłka jednego maila. Zamówienia są najpierw „rezerwowane” (followup_sent_at),
 * więc ten sam klient nie dostanie dwóch maili, nawet gdy wysyłka ruszy równolegle.
 * Z parametrem `to` (mail próbny) nic nie jest zapisywane.
 */
export async function sendFollowup(b: Buyer, promo: Promo | null, all: Rec[], to?: string): Promise<boolean> {
  const recs = recommendationsFor(b, all);
  const { subject, html } = followupHtml(b, promo, recs);
  if (to) return sendEmail(to, subject, html);
  if (!b.pendingOrderIds.length) return false;
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { data: claimed } = await db.from('orders').update({ followup_sent_at: now }).in('id', b.pendingOrderIds).is('followup_sent_at', null).select('id');
  if (!claimed?.length) return false; // ktoś inny już wysłał
  const ok = await sendEmail(b.email, subject, html).catch(() => false);
  if (!ok) await db.from('orders').update({ followup_sent_at: null }).in('id', claimed.map((c) => c.id as string));
  return ok;
}

export interface FollowupSettings {
  auto: boolean;
  code: string;
  days: number;
}

const DEFAULTS: FollowupSettings = { auto: false, code: 'DZIEKUJE30', days: 2 };

export async function getFollowupSettings(): Promise<FollowupSettings & { ready: boolean }> {
  const { data, error } = await createAdminClient().from('site_settings').select('followup_auto, followup_code, followup_days').eq('id', 1).maybeSingle();
  if (error || !data) return { ...DEFAULTS, ready: !error };
  return { auto: Boolean(data.followup_auto), code: String(data.followup_code ?? DEFAULTS.code), days: Number(data.followup_days ?? DEFAULTS.days), ready: true };
}

/** Wysyła maila wszystkim, którym się należy (kupili ≥ `days` dni temu i jeszcze nie dostali). */
export async function sendDueFollowups(opts: { code: string; days: number; limit: number }) {
  const [{ buyers, ready }, promo, cases] = await Promise.all([
    getBuyers(),
    loadPromo(opts.code),
    createAdminClient().from('cases').select('slug, title, tagline, price_grosze, cover_path, case_number').eq('is_published', true).order('sort_order'),
  ]);
  if (!ready) return { ready, sent: 0, failed: 0, left: 0 };
  const recs = (cases.data ?? []) as Rec[];
  const cutoff = Date.now() - opts.days * 864e5;
  const due = buyers.filter((b) => b.pendingOrderIds.length && b.lastPaidAt && new Date(b.lastPaidAt).getTime() <= cutoff);
  let sent = 0, failed = 0;
  for (const b of due.slice(0, opts.limit)) {
    (await sendFollowup(b, promo, recs)) ? sent++ : failed++;
    await new Promise((r) => setTimeout(r, 600)); // limit Resend: ok. 2 maile na sekundę
  }
  return { ready, sent, failed, left: Math.max(0, due.length - opts.limit) };
}

let lastAutoRun = 0;
/**
 * Automatyczne maile po zakupie — uruchamiane „przy okazji” ruchu na stronie,
 * najwyżej raz na 30 minut. Nie wymaga osobnego crona.
 */
export function maybeRunAutoFollowups() {
  if (Date.now() - lastAutoRun < 30 * 60 * 1000) return;
  lastAutoRun = Date.now();
  void (async () => {
    try {
      const s = await getFollowupSettings();
      if (!s.ready || !s.auto) return;
      const r = await sendDueFollowups({ code: s.code, days: s.days, limit: 20 });
      if (r.sent || r.failed) console.log('[followup] auto', r);
    } catch (e) {
      console.error('[followup] auto', e);
    }
  })();
}
