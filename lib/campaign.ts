import 'server-only';
import { getAdmins } from './admins';
import { publicStorageUrl, siteConfig } from './config';
import { sendEmail } from './email';
import { formatPrice } from './format';
import { type Promo, type Rec } from './followup';
import { sellerIdentity } from './legal/seller';
import { createAdminClient } from './supabase/admin';

/**
 * KAMPANIA DO NEWSLETTERA — tylko osoby z potwierdzonym zapisem (zgoda marketingowa).
 * Każdy adres dostaje daną kampanię raz (tabela newsletter_sends, klucz = kod rabatowy).
 */

const SIGNATURE = process.env.FOLLOWUP_SIGNATURE || 'Aleksander';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface Subscriber {
  email: string;
  token: string;
  confirmed_at?: string | null;
}

export async function getSubscribers(withDates = false): Promise<Subscriber[]> {
  const [{ data }, admins] = await Promise.all([
    createAdminClient()
      .from('newsletter_subscribers')
      .select(withDates ? 'email, token, confirmed_at' : 'email, token')
      .eq('status', 'confirmed')
      .limit(50000),
    getAdmins(),
  ]);
  return ((data ?? []) as unknown as Subscriber[]).filter((s) => !admins.emails.has(s.email.toLowerCase()));
}

export async function getCampaignSends(campaign?: string) {
  let q = createAdminClient().from('newsletter_sends').select('campaign, email, sent_at').order('sent_at', { ascending: false }).limit(2000);
  if (campaign) q = q.eq('campaign', campaign);
  const { data, error } = await q;
  return { ready: !error, sends: (data ?? []) as { campaign: string; email: string; sent_at: string }[] };
}

export function campaignHtml(sub: Subscriber, promo: Promo, cases: Rec[]): { subject: string; html: string } {
  const q = `?kod=${encodeURIComponent(promo.code)}&utm_source=mail&utm_medium=email&utm_campaign=newsletter-${encodeURIComponent(promo.code.toLowerCase())}`;
  const cell = (r: Rec) => {
    const img = publicStorageUrl('covers', r.cover_path);
    const src = img ? (img.startsWith('http') ? img : siteConfig.url + img) : null;
    return `<td style="width:33%;padding:6px;vertical-align:top;text-align:center">
      <a href="${siteConfig.url}/sprawy/${r.slug}${q}" style="text-decoration:none;color:#1c1a17">
        ${src ? `<img src="${esc(src)}" alt="${esc(r.title)}" width="150" style="width:100%;max-width:150px;border-radius:6px;display:block;margin:0 auto 8px">` : ''}
        <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#8a6d33">AKTA #${esc(r.case_number)}</div>
        <div style="font-size:15px;font-weight:bold;margin-top:2px;line-height:1.25">${esc(r.title)}</div>
        <div style="font-family:Arial,sans-serif;font-size:13px;color:#666;margin-top:4px">${formatPrice(r.price_grosze)}</div>
      </a></td>`;
  };
  const rows: string[] = [];
  for (let i = 0; i < cases.length; i += 3) rows.push(`<tr>${cases.slice(i, i + 3).map(cell).join('')}</tr>`);
  const P = (t: string) => `<p style="font-size:16px;line-height:1.65;margin:0 0 16px">${t}</p>`;
  const until = promo.until ? ` — tylko do ${esc(promo.until)}` : '';

  const html = `<!doctype html><html lang="pl"><head><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#efe8d8;font-family:Georgia,serif;color:#1c1a17">
<div style="display:none;max-height:0;overflow:hidden">Kup dwie sprawy, tańszą dostajesz za 0 zł${until}.</div>
<div style="max-width:600px;margin:0 auto;padding:28px 14px">
  <p style="text-align:center;font-family:'Courier New',monospace;letter-spacing:4px;font-size:12px;color:#8a6d33;text-transform:uppercase;margin:0 0 14px">🔍 ${esc(siteConfig.name)}</p>
  <div style="background:#fbf8f1;border:1px solid #e0d6bf;border-radius:12px;padding:30px 26px;box-shadow:0 2px 0 #e0d6bf">
    <h1 style="font-size:26px;margin:0 0 18px">Cześć, detektywie!</h1>
    ${P(`Z tej strony ${esc(SIGNATURE)} z Akt Detektywa. Dzięki, że jesteś z nami od darmowej sprawy — mam nadzieję, że „Tajemnica spowiedzi” wciągnęła cię tak, jak mnie jej pisanie.`)}
    ${P('Dziś mam dla ciebie coś, czego jeszcze nie było: <strong>kup dwie sprawy, a tańszą z nich dostajesz za 0 zł.</strong> Jedna na wieczór dla siebie, druga — na kolejny albo na prezent dla kogoś, kto lubi kryminały.')}
    <div style="margin:26px 0;padding:26px 22px;background:#1c1a17;border-radius:10px;text-align:center;color:#f4efe3">
      <p style="font-family:'Courier New',monospace;letter-spacing:3px;font-size:11px;color:#d4b06a;margin:0;text-transform:uppercase">Tylko dla subskrybentów${until}</p>
      <p style="font-size:28px;font-weight:bold;margin:10px 0 6px">Druga sprawa za 0 zł</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#cfc6b3;margin:0 0 16px">Dodaj 2 sprawy do koszyka i wpisz kod:</p>
      <div style="display:inline-block;border:2px dashed #d4b06a;padding:10px 22px;font-family:'Courier New',monospace;font-size:24px;letter-spacing:4px;color:#d4b06a;font-weight:bold">${esc(promo.code)}</div>
      <p style="margin:20px 0 0"><a href="${siteConfig.url}/sprawy${q}" style="background:#d4b06a;color:#1c1a17;padding:12px 24px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;display:inline-block">Wybierz dwie sprawy</a></p>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#a89f8d;margin:14px 0 0">Kod wpisze się sam, jeśli wejdziesz przez link z tego maila.</p>
    </div>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#666;margin:0 0 6px;text-align:center">Wszystkie sprawy w archiwum:</p>
    <table role="presentation" style="width:100%;border-collapse:collapse">${rows.join('')}</table>
    <p style="font-size:16px;line-height:1.6;margin:24px 0 0">Gdybyś miał(a) pytanie albo pomysł na kolejną sprawę — po prostu odpisz. Czytam wszystko sam.</p>
    <p style="font-size:16px;line-height:1.5;margin:14px 0 0"><span style="font-size:20px;font-style:italic">${esc(SIGNATURE)}</span><br><span style="color:#777;font-size:14px">twórca Akt Detektywa, Gdynia</span></p>
  </div>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#8f877a;line-height:1.5;margin:18px 6px 0;text-align:center">Dostajesz tę wiadomość, bo zapisałeś(-aś) się do newslettera ${esc(siteConfig.name)}. <a href="${siteConfig.url}/newsletter/wypisz?token=${encodeURIComponent(sub.token)}" style="color:#888">Wypisz się</a>.<br>${esc(sellerIdentity())}</p>
</div></body></html>`;
  return { subject: `Druga sprawa za 0 zł${promo.until ? ` — do ${promo.until}` : ''} 🔍`, html };
}

export async function loadCases(): Promise<Rec[]> {
  const { data } = await createAdminClient()
    .from('cases')
    .select('slug, title, tagline, price_grosze, cover_path, case_number')
    .eq('is_published', true)
    .order('sort_order');
  return (data ?? []) as Rec[];
}

/** Wysyła kampanię do subskrybentów, którzy jej jeszcze nie dostali. */
export async function sendCampaign(promo: Promo, limit = 60) {
  const [subs, { ready, sends }, cases] = await Promise.all([getSubscribers(), getCampaignSends(promo.code), loadCases()]);
  if (!ready) return { ready, sent: 0, failed: 0, left: 0 };
  const done = new Set(sends.map((s) => s.email.toLowerCase()));
  const todo = subs.filter((s) => !done.has(s.email.toLowerCase()));
  const db = createAdminClient();
  let sent = 0, failed = 0;
  for (const s of todo.slice(0, limit)) {
    // najpierw rezerwacja (unikalna para kampania+email), potem wysyłka
    const { error } = await db.from('newsletter_sends').insert({ campaign: promo.code, email: s.email.toLowerCase() });
    if (error) continue; // ktoś już wysłał
    const { subject, html } = campaignHtml(s, promo, cases);
    const ok = await sendEmail(s.email, subject, html).catch(() => false);
    if (ok) sent++;
    else {
      failed++;
      await db.from('newsletter_sends').delete().eq('campaign', promo.code).eq('email', s.email.toLowerCase());
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return { ready, sent, failed, left: Math.max(0, todo.length - limit) };
}
