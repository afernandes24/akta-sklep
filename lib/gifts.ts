import 'server-only';
import { randomInt } from 'crypto';
import { siteConfig } from './config';
import { sendEmail } from './email';
import { formatPrice } from './format';
import { sellerIdentity } from './legal/seller';
import { volumeDiscount } from './pricing';
import { createAdminClient } from './supabase/admin';
import { telegram } from './telegram';

/**
 * PREZENTY, KARTY PODARUNKOWE I POLECENIA.
 * - Prezent (sprawa): kupujący podaje adres obdarowanego i datę — w tym dniu wysyłamy mu link do akt.
 * - Karta podarunkowa: kod z saldem (np. 50 zł), działa na kilka zakupów, ważny 12 miesięcy.
 * - Polecenia: każdy kupujący dostaje kod POLEC-…; znajomy −20%, polecający dostaje 20 zł na kolejną sprawę.
 */

export const GIFT_CARD_AMOUNTS = [3000, 5000, 7500, 10000] as const;
export const REFERRAL_FRIEND_PERCENT = 20;
export const REFERRAL_REWARD_GROSZE = 2000;
const SIGNATURE = process.env.FOLLOWUP_SIGNATURE || 'Aleksander';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bez 0/O/1/I — łatwiej przepisać
const randomPart = (n: number) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
const dateLong = (d: string | Date) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' }).format(new Date(d));

async function insertUniqueCode(prefix: string, row: Record<string, unknown>): Promise<string | null> {
  const db = createAdminClient();
  for (let i = 0; i < 5; i++) {
    const code = `${prefix}-${randomPart(6)}`;
    const { error } = await db.from('discount_codes').insert({ code, ...row });
    if (!error) return code;
    if (!/duplicate|unique/i.test(error.message)) {
      console.error('[gifts] kod', error.message);
      return null;
    }
  }
  return null;
}

/* ── Polecenia ─────────────────────────────────────────────────────── */

/** Kod polecający klienta (tworzy przy pierwszym zakupie). */
export async function ensureReferralCode(email: string): Promise<string | null> {
  const db = createAdminClient();
  const e = email.trim().toLowerCase();
  const { data, error } = await db.from('discount_codes').select('code').ilike('referrer_email', e).maybeSingle();
  if (error) return null; // brak kolumn (nie uruchomiono SQL)
  if (data?.code) return data.code as string;
  return insertUniqueCode('POLEC', {
    percent_off: REFERRAL_FRIEND_PERCENT,
    min_items: 1,
    one_per_user: true,
    is_active: true,
    referrer_email: e,
    note: `Polecenie: ${e}`,
  });
}

export async function getReferralCode(email: string | null | undefined): Promise<string | null> {
  if (!email) return null;
  const { data } = await createAdminClient().from('discount_codes').select('code, is_active').ilike('referrer_email', email.trim().toLowerCase()).maybeSingle();
  return data?.is_active ? (data.code as string) : null;
}

function shell(title: string, body: string, preheader: string) {
  return `<!doctype html><html lang="pl"><head><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#efe8d8;font-family:Georgia,serif;color:#1c1a17">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<div style="max-width:600px;margin:0 auto;padding:28px 14px">
  <p style="text-align:center;font-family:'Courier New',monospace;letter-spacing:4px;font-size:12px;color:#8a6d33;text-transform:uppercase;margin:0 0 14px">🔍 ${esc(siteConfig.name)}</p>
  <div style="background:#fbf8f1;border:1px solid #e0d6bf;border-radius:12px;padding:30px 26px;box-shadow:0 2px 0 #e0d6bf">
    <h1 style="font-size:26px;margin:0 0 18px">${title}</h1>
    ${body}
  </div>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#8f877a;line-height:1.5;margin:18px 6px 0;text-align:center">${esc(sellerIdentity())}</p>
</div></body></html>`;
}
const P = (t: string) => `<p style="font-size:16px;line-height:1.65;margin:0 0 16px">${t}</p>`;
const codeBox = (code: string, sub: string) =>
  `<div style="margin:22px 0;padding:22px;background:#1c1a17;border-radius:10px;text-align:center;color:#f4efe3">
    <div style="display:inline-block;border:2px dashed #d4b06a;padding:10px 22px;font-family:'Courier New',monospace;font-size:24px;letter-spacing:4px;color:#d4b06a;font-weight:bold">${esc(code)}</div>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#cfc6b3;margin:12px 0 0">${sub}</p>
  </div>`;
const button = (href: string, label: string) =>
  `<p style="margin:22px 0;text-align:center"><a href="${href}" style="background:#d4b06a;color:#1c1a17;padding:13px 26px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;display:inline-block">${label}</a></p>`;

async function rewardReferrer(referrerEmail: string, buyerEmail: string, orderId: string) {
  const db = createAdminClient();
  // Jedna nagroda za jedno zamówienie (tabela newsletter_sends jako rejestr „już wysłane”)
  const { error } = await db.from('newsletter_sends').insert({ campaign: `NAGRODA-${orderId}`, email: referrerEmail.toLowerCase() });
  if (error) return;
  const until = new Date(Date.now() + 180 * 864e5);
  const code = await insertUniqueCode('NAGRODA', {
    amount_off_grosze: REFERRAL_REWARD_GROSZE,
    min_items: 1,
    max_uses: 1,
    one_per_user: false,
    is_active: true,
    valid_until: until.toISOString(),
    note: `Nagroda za polecenie (${buyerEmail})`,
  });
  if (!code) return;
  const html = shell(
    'Twój znajomy właśnie kupił sprawę 🎉',
    `${P(`Ktoś skorzystał z twojego kodu polecającego — dziękuję! Zgodnie z obietnicą masz <strong>${formatPrice(REFERRAL_REWARD_GROSZE)}</strong> na kolejną sprawę.`)}
    ${codeBox(code, `Wpisz w koszyku · ważny do ${dateLong(until)}`)}
    ${button(`${siteConfig.url}/sprawy?kod=${code}&utm_source=mail&utm_medium=email&utm_campaign=polecenia`, 'Wybierz sprawę')}
    ${P(`Twój kod polecający działa dalej — za każdego kolejnego znajomego dostaniesz następną nagrodę.`)}
    <p style="font-size:16px;margin:14px 0 0"><span style="font-size:20px;font-style:italic">${esc(SIGNATURE)}</span></p>`,
    `Masz ${formatPrice(REFERRAL_REWARD_GROSZE)} na kolejną sprawę`,
  );
  await sendEmail(referrerEmail, `Masz ${formatPrice(REFERRAL_REWARD_GROSZE)} na kolejną sprawę — dzięki za polecenie!`, html);
  await telegram('🤝 Polecenie zadziałało', [`${buyerEmail} kupił(a) z kodem od ${referrerEmail}`]);
}

/* ── Po opłaceniu zamówienia ───────────────────────────────────────── */

/**
 * Wywoływane raz, przy pierwszym oznaczeniu zamówienia jako opłacone (lib/orders.ts).
 * Kolejność: karta podarunkowa → saldo użytej karty → nagroda za polecenie → kod polecający kupującego → prezent.
 */
export async function afterOrderPaid(orderId: string) {
  const db = createAdminClient();
  const { data: o, error } = await db
    .from('orders')
    .select('id, email, discount_code, discount_grosze, subtotal_grosze, gift_kind, gift_card_grosze, gift_card_code, gift_send_at, order_items(id)')
    .eq('id', orderId)
    .maybeSingle();
  if (error || !o) return; // baza bez kolumn z prezenty-polecenia.sql

  // 1. Kupiona karta podarunkowa → kod z saldem
  if (o.gift_kind === 'card' && o.gift_card_grosze && !o.gift_card_code) {
    const until = new Date(Date.now() + 365 * 864e5);
    const code = await insertUniqueCode('KARTA', {
      amount_off_grosze: o.gift_card_grosze,
      gift_balance_grosze: o.gift_card_grosze,
      is_gift: true,
      min_items: 1,
      one_per_user: false,
      is_active: true,
      valid_until: until.toISOString(),
      note: `Karta podarunkowa ${formatPrice(o.gift_card_grosze as number)} (zamówienie ${orderId})`,
    });
    if (code) await db.from('orders').update({ gift_card_code: code }).eq('id', orderId);
  }

  // 2. Zapłacono kartą podarunkową → zmniejszamy saldo
  if (o.discount_code) {
    const { data: c } = await db.from('discount_codes').select('code, is_gift, gift_balance_grosze, referrer_email').eq('code', o.discount_code).maybeSingle();
    if (c?.is_gift) {
      const items = (o.order_items ?? []).length;
      const vol = volumeDiscount((o.subtotal_grosze as number) ?? 0, items)?.amount ?? 0;
      const used = Math.max(0, ((o.discount_grosze as number) ?? 0) - vol);
      const left = Math.max(0, ((c.gift_balance_grosze as number) ?? 0) - used);
      await db.from('discount_codes').update({ gift_balance_grosze: left, is_active: left > 0 }).eq('code', c.code);
    }
    // 3. Kod polecający znajomego → nagroda dla polecającego
    if (c?.referrer_email && String(c.referrer_email).toLowerCase() !== String(o.email).toLowerCase()) {
      await rewardReferrer(String(c.referrer_email), String(o.email), orderId).catch((e) => console.error('[gifts] nagroda', e));
    }
  }

  // 4. Kod polecający dla kupującego (pokazujemy go w mailu i na stronie zamówienia)
  if (o.gift_kind !== 'card') await ensureReferralCode(String(o.email)).catch(() => null);

  // 5. Prezent z datą „dziś” wychodzi od razu
  if (o.gift_kind && (!o.gift_send_at || new Date(o.gift_send_at as string) <= new Date())) await sendDueGifts(orderId);
}

/* ── Wysyłka prezentów ─────────────────────────────────────────────── */

type GiftOrder = {
  id: string;
  email: string;
  access_token: string;
  gift_kind: 'case' | 'card';
  gift_to_email: string;
  gift_to_name: string | null;
  gift_from_name: string | null;
  gift_message: string | null;
  gift_card_grosze: number | null;
  gift_card_code: string | null;
  order_items: { title: string }[];
};

export function giftEmailHtml(o: GiftOrder): { subject: string; html: string } {
  const from = o.gift_from_name?.trim() || 'Ktoś bliski';
  const hello = o.gift_to_name?.trim() ? `Cześć, ${esc(o.gift_to_name.trim())}!` : 'Cześć!';
  const note = o.gift_message?.trim()
    ? `<div style="margin:20px 0;padding:18px 20px;background:#fff;border:1px solid #e0d6bf;border-radius:8px;font-style:italic;font-size:17px;line-height:1.6;white-space:pre-wrap">„${esc(o.gift_message.trim())}”<div style="font-style:normal;font-size:14px;color:#777;margin-top:8px">— ${esc(from)}</div></div>`
    : '';
  if (o.gift_kind === 'card') {
    const value = formatPrice(o.gift_card_grosze ?? 0);
    return {
      subject: `🎁 ${from} podarował(a) ci kartę podarunkową Akta Detektywa (${value})`,
      html: shell(
        hello,
        `${P(`<strong>${esc(from)}</strong> przesyła ci <strong>kartę podarunkową na ${value}</strong> do sklepu z grami detektywistycznymi do druku. Wybierasz sprawę, drukujesz akta i prowadzisz własne śledztwo.`)}
        ${note}
        ${codeBox(o.gift_card_code ?? '—', `Saldo ${value} · wpisz kod w koszyku · ważna 12 miesięcy · można wykorzystać w kilku zakupach`)}
        ${button(`${siteConfig.url}/sprawy?kod=${encodeURIComponent(o.gift_card_code ?? '')}&utm_source=mail&utm_medium=email&utm_campaign=prezent`, 'Wybierz sprawę')}`,
        `${from} ma dla ciebie prezent`,
      ),
    };
  }
  const titles = o.order_items.map((i) => esc(i.title.replace(/^AKTA #\d+ — /, ''))).map((t) => `„${t}”`).join(', ');
  return {
    subject: `🎁 ${from} ma dla ciebie prezent: sprawa kryminalna do rozwiązania`,
    html: shell(
      hello,
      `${P(`<strong>${esc(from)}</strong> podarował(a) ci ${o.order_items.length > 1 ? 'sprawy' : 'sprawę'} ${titles} — prawdziwe akta kryminalne do wydrukowania i rozwiązania w domu.`)}
      ${note}
      ${button(`${siteConfig.url}/dostep/${o.access_token}`, 'Otwórz prezent')}
      ${P('Pod linkiem pobierzesz pliki PDF (działa bez zakładania konta — zachowaj tego maila). Wydrukuj akta, zaproś kogoś do stołu i idź cel po celu. Powodzenia, detektywie!')}`,
      `${from} ma dla ciebie prezent`,
    ),
  };
}

/** Wysyła prezenty, których termin minął (albo jeden konkretny). Wywoływane po płatności i przy okazji ruchu na stronie. */
export async function sendDueGifts(onlyOrderId?: string) {
  const db = createAdminClient();
  let q = db
    .from('orders')
    .select('id, email, access_token, gift_kind, gift_to_email, gift_to_name, gift_from_name, gift_message, gift_card_grosze, gift_card_code, order_items(title)')
    .eq('status', 'paid')
    .not('gift_kind', 'is', null)
    .is('gift_sent_at', null)
    .lte('gift_send_at', new Date().toISOString())
    .limit(20);
  if (onlyOrderId) q = q.eq('id', onlyOrderId);
  const { data, error } = await q;
  if (error) return 0;
  let sent = 0;
  for (const o of (data ?? []) as unknown as GiftOrder[]) {
    if (!o.gift_to_email || (o.gift_kind === 'card' && !o.gift_card_code)) continue;
    // Rezerwacja: tylko jeden proces wysyła dany prezent
    const { data: claimed } = await db.from('orders').update({ gift_sent_at: new Date().toISOString() }).eq('id', o.id).is('gift_sent_at', null).select('id');
    if (!claimed?.length) continue;
    const { subject, html } = giftEmailHtml(o);
    const ok = await sendEmail(o.gift_to_email, subject, html, o.email).catch(() => false);
    if (ok) {
      sent++;
      await sendEmail(
        o.email,
        'Prezent dotarł 🎁',
        shell(
          'Prezent wysłany',
          `${P(`Właśnie wysłaliśmy prezent na adres <strong>${esc(o.gift_to_email)}</strong>. Jeśli nie dotrze, niech obdarowany zajrzy do spamu albo zakładki „Oferty” — w razie czego odpisz na tego maila.`)}`,
          'Prezent wysłany',
        ),
      ).catch(() => false);
    } else {
      await db.from('orders').update({ gift_sent_at: null }).eq('id', o.id);
    }
  }
  return sent;
}

let lastGiftRun = 0;
export function maybeSendDueGifts() {
  if (Date.now() - lastGiftRun < 15 * 60 * 1000) return;
  lastGiftRun = Date.now();
  void sendDueGifts().catch((e) => console.error('[gifts]', e));
}

/* ── Kod za opinię ─────────────────────────────────────────────────── */

export const REVIEW_REWARD_CODE = 'ZAOPINIE';

/** Po wystawieniu opinii (dowolnej oceny) — jeden mail z kodem na adres. */
export async function sendReviewReward(email: string) {
  const db = createAdminClient();
  const { data: c } = await db.from('discount_codes').select('code, is_active, percent_off').eq('code', REVIEW_REWARD_CODE).maybeSingle();
  if (!c?.is_active) return;
  const { error } = await db.from('newsletter_sends').insert({ campaign: REVIEW_REWARD_CODE, email: email.toLowerCase() });
  if (error) return; // już dostał(a)
  const html = shell(
    'Dzięki za opinię!',
    `${P('Każda opinia — także krytyczna — pomaga mi pisać lepsze sprawy, a innym wybrać coś dla siebie. W podziękowaniu:')}
    ${codeBox(c.code as string, `−${c.percent_off}% na kolejną sprawę · wpisz w koszyku`)}
    ${button(`${siteConfig.url}/sprawy?kod=${c.code}&utm_source=mail&utm_medium=email&utm_campaign=za-opinie`, 'Wybierz kolejną sprawę')}
    <p style="font-size:16px;margin:14px 0 0"><span style="font-size:20px;font-style:italic">${esc(SIGNATURE)}</span></p>`,
    `−${c.percent_off}% na kolejną sprawę`,
  );
  const ok = await sendEmail(email, `Dzięki za opinię — masz −${c.percent_off}% na kolejną sprawę`, html).catch(() => false);
  if (!ok) await db.from('newsletter_sends').delete().eq('campaign', REVIEW_REWARD_CODE).eq('email', email.toLowerCase());
}
