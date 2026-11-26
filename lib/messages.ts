import 'server-only';
import { siteConfig } from './config';
import { notifyOwner, sendEmail } from './email';
import { seller, sellerIdentity } from './legal/seller';
import { createAdminClient } from './supabase/admin';

/**
 * Wiadomości jako rozmowa: pierwsza wiadomość z formularza kontaktowego (albo od Ciebie z panelu),
 * a dalej odpowiedzi w tabeli contact_replies. Klient widzi rozmowę i odpisuje pod /wiadomosc/<token>.
 */

export type Thread = {
  id: string;
  token: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  last_activity_at: string;
  started_by: 'client' | 'admin';
};
export type Reply = { id: string; author: 'admin' | 'client'; body: string; created_at: string };

const COLS = 'id, token, name, email, subject, message, is_read, created_at, last_activity_at, started_by';
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function listThreads(limit = 200) {
  const { data, error } = await createAdminClient().from('contact_messages').select(COLS).order('last_activity_at', { ascending: false }).limit(limit);
  return { ready: !error, threads: (data ?? []) as Thread[] };
}

export async function loadThread(by: { id?: string; token?: string }) {
  const key = by.id ? 'id' : 'token';
  const val = by.id ?? by.token ?? '';
  if (!UUID_RE.test(val)) return null;
  const db = createAdminClient();
  const { data } = await db.from('contact_messages').select(COLS).eq(key, val).maybeSingle();
  if (!data) return null;
  const { data: replies } = await db.from('contact_replies').select('id, author, body, created_at').eq('message_id', data.id).order('created_at');
  return { thread: data as Thread, replies: (replies ?? []) as Reply[] };
}

export const threadUrl = (token: string) => `${siteConfig.url}/wiadomosc/${token}`;
export const adminThreadUrl = (id: string) => `${siteConfig.url}/admin/wiadomosci/${id}`;

/** Mail do klienta z Twoją odpowiedzią + przycisk „Odpisz na stronie”. */
export async function emailClient(t: Thread, body: string, history: { who: string; body: string }[]) {
  const P = (x: string) => `<p style="font-size:16px;line-height:1.65;margin:0 0 14px;white-space:pre-wrap">${esc(x)}</p>`;
  const prev = history
    .slice(-3)
    .map((h) => `<div style="border-left:3px solid #e0d6bf;padding:2px 0 2px 12px;margin:0 0 10px;color:#6b645a;font-size:14px;line-height:1.5;white-space:pre-wrap"><strong>${esc(h.who)}:</strong> ${esc(h.body.slice(0, 600))}</div>`)
    .join('');
  const html = `<!doctype html><html lang="pl"><head><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#efe8d8;font-family:Georgia,serif;color:#1c1a17">
<div style="max-width:600px;margin:0 auto;padding:28px 14px">
  <p style="text-align:center;font-family:'Courier New',monospace;letter-spacing:4px;font-size:12px;color:#8a6d33;text-transform:uppercase;margin:0 0 14px">🔍 ${esc(siteConfig.name)}</p>
  <div style="background:#fbf8f1;border:1px solid #e0d6bf;border-radius:12px;padding:28px 24px">
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#8a6d33;margin:0 0 14px">${esc(t.subject || 'Twoja wiadomość')}</p>
    ${P(`Cześć${t.name && !t.name.includes('@') ? ` ${t.name}` : ''}!`)}
    ${P(body)}
    <p style="text-align:center;margin:22px 0"><a href="${threadUrl(t.token)}" style="background:#1c1a17;color:#d4b06a;padding:12px 24px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;display:inline-block">Odpisz na stronie</a></p>
    ${prev ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:#999;margin:18px 0 8px">Wcześniej w rozmowie:</p>${prev}` : ''}
  </div>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#8f877a;line-height:1.5;margin:18px 6px 0;text-align:center">Możesz też po prostu odpowiedzieć na tego maila.<br>${esc(sellerIdentity())}</p>
</div></body></html>`;
  const replyTo = seller.email && !seller.email.startsWith('[') ? seller.email : undefined;
  return sendEmail(t.email, `Odpowiedź: ${t.subject || 'Twoja wiadomość'} — ${siteConfig.name}`, html, replyTo).catch(() => false);
}

/** Powiadomienie dla Ciebie, że klient odpisał na stronie. */
export async function notifyOwnerReply(t: Thread, body: string) {
  return notifyOwner(`Nowa odpowiedź: ${t.subject || 'rozmowa'}`, [`Od: ${t.name} <${t.email}>`, body, `Odpowiedz w panelu: ${adminThreadUrl(t.id)}`], t.email);
}
