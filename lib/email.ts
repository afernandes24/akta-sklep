import 'server-only';
import { siteConfig } from './config';
import { formatDate, formatPrice } from './format';
import { type Block, DIGITAL_CONSENT_TEXT, regulamin } from './legal/documents';
import { seller, sellerIdentity } from './legal/seller';
import { createAdminClient } from './supabase/admin';
import { telegram } from './telegram';

/**
 * Wysyłka e-maili przez Resend (https://resend.com) — bez dodatkowych bibliotek.
 * Wymaga RESEND_API_KEY i EMAIL_FROM. Bez nich e-mail jest tylko logowany.
 */
export async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.warn(`[email] Pominięto wysyłkę „${subject}” do ${to} — brak RESEND_API_KEY / EMAIL_FROM`);
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, reply_to: replyTo ?? (seller.email.startsWith('[') ? undefined : seller.email) }),
  });
  if (!res.ok) console.error('[email] Resend', res.status, await res.text().catch(() => ''));
  return res.ok;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Powiadomienie dla właściciela sklepu (na adres kontaktowy sprzedawcy).
 * Linie tekstu są escapowane — można bezpiecznie przekazać dane od klienta.
 */
export async function notifyOwner(subject: string, lines: string[], replyTo?: string): Promise<boolean> {
  await telegram(subject.startsWith('UWAGA') ? `⚠️ ${subject}` : `✉️ ${subject}`, lines.slice(0, 3));
  const to = seller.email;
  if (!to || to.startsWith('[')) return false;
  const body = lines.map((l) => `<p style="margin:0 0 8px;white-space:pre-wrap">${esc(l)}</p>`).join('');
  const html = `<!doctype html><html lang="pl"><body style="font-family:Arial,sans-serif;font-size:14px;color:#1c1a17">${body}<p style="margin-top:16px;color:#777;font-size:12px">${esc(siteConfig.name)} · ${esc(siteConfig.url)}/admin</p></body></html>`;
  return sendEmail(to, `[${siteConfig.name}] ${subject}`, html, replyTo).catch(() => false);
}

function blockHtml(b: Block): string {
  if (typeof b === 'string') return `<p style="margin:0 0 8px">${esc(b)}</p>`;
  const tag = b.ordered ? 'ol' : 'ul';
  return `<${tag} style="margin:0 0 8px;padding-left:20px">${b.list.map((i) => `<li style="margin-bottom:4px">${esc(i)}</li>`).join('')}</${tag}>`;
}

function regulaminHtml(): string {
  const doc = regulamin();
  return doc.sections
    .map((s) => `<h3 style="font-size:13px;margin:16px 0 6px">${esc(s.title)}</h3>${s.blocks.map(blockHtml).join('')}`)
    .join('');
}

/**
 * Potwierdzenie zawarcia umowy na trwałym nośniku (art. 21 ustawy o prawach konsumenta)
 * — wymagane, by wyłączenie prawa odstąpienia (art. 38 ust. 1 pkt 13) było skuteczne.
 */
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  const db = createAdminClient();
  const { data: order } = await db
    .from('orders')
    .select('id, order_number, email, user_id, access_token, total_grosze, discount_grosze, discount_label, created_at, paid_at, consent_digital_at, order_items(title, price_grosze, list_price_grosze)')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return;

  const items = (order.order_items ?? []) as { title: string; price_grosze: number; list_price_grosze: number | null }[];
  const discount = (order.discount_grosze as number | null) ?? 0;
  const rows =
    items
      .map(
        (i) =>
          `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${esc(i.title)}${/\(wersja online\)$/.test(i.title) ? '' : ' (PDF)'}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(discount ? (i.list_price_grosze ?? i.price_grosze) : i.price_grosze)}</td></tr>`,
      )
      .join('') +
    (discount
      ? `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;color:#2d6a3e">${esc(String(order.discount_label ?? 'Rabat'))}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;color:#2d6a3e">−${formatPrice(discount)}</td></tr>`
      : '');

  const hasOnline = items.some((i) => /\(wersja online\)$/.test(i.title));
  const hasPdf = items.some((i) => !/\(wersja online\)$/.test(i.title));
  const ready = hasPdf && hasOnline ? 'Pliki PDF i wersja online czekają' : hasOnline ? 'Wersja online czeka' : 'Pliki PDF czekają';
  // Zakup bez konta: link dostępu z tokenem; z kontem: „Moje sprawy”.
  const guest = !order.user_id && Boolean(order.access_token);
  const accessUrl = guest ? `${siteConfig.url}/dostep/${order.access_token}` : `${siteConfig.url}/konto/sprawy`;
  const where = guest ? 'pod tym linkiem (działa bez logowania — zachowaj tego maila)' : 'na twoim koncie';

  // Prezent / karta podarunkowa / kod polecający (kolumny z supabase/prezenty-polecenia.sql — bez nich mail jak dawniej)
  const { data: extra } = await db.from('orders').select('gift_kind, gift_to_email, gift_send_at, gift_card_code').eq('id', orderId).maybeSingle();
  const { data: ref } = extra ? await db.from('discount_codes').select('code').ilike('referrer_email', String(order.email).toLowerCase()).maybeSingle() : { data: null };
  const isCard = extra?.gift_kind === 'card';
  const giftTo = extra?.gift_to_email && String(extra.gift_to_email).toLowerCase() !== String(order.email).toLowerCase() ? String(extra.gift_to_email) : null;
  const giftWhen = extra?.gift_send_at && new Date(extra.gift_send_at as string) > new Date() ? `${formatDate(extra.gift_send_at as string)} ok. 8:00` : 'od razu';
  const giftLine = giftTo ? `<p style="background:#fff;border:1px solid #e0d6bf;border-radius:8px;padding:12px 14px">🎁 <strong>Prezent:</strong> wyślemy go na <strong>${esc(giftTo)}</strong> — ${giftWhen}. Dostaniesz maila, gdy wyjdzie.</p>` : '';
  const intro = isCard
    ? `Dziękujemy za zakup karty podarunkowej! Płatność za zamówienie <strong>nr ${order.order_number}</strong> została potwierdzona.${giftTo ? '' : ` Kod karty: <strong style="font-family:'Courier New',monospace;font-size:18px;letter-spacing:2px">${esc(String(extra?.gift_card_code ?? ''))}</strong> — wpisz go w koszyku albo podaruj komuś. Karta jest ważna 12 miesięcy, a saldo zostaje na kolejne zakupy.`}`
    : `Dziękujemy za zakup! Płatność za zamówienie <strong>nr ${order.order_number}</strong> została potwierdzona. ${ready} ${where}:`;
  const refBlock =
    ref?.code && !isCard
      ? `<div style="margin:24px 0;padding:16px;background:#1c1a17;color:#f4efe3;border-radius:8px;font-family:Arial,sans-serif;font-size:14px;line-height:1.5"><strong style="color:#d4b06a">Poleć znajomym:</strong> z kodem <strong style="font-family:'Courier New',monospace;color:#d4b06a;letter-spacing:2px">${esc(String(ref.code))}</strong> znajomy ma −20%, a ty po jego zakupie dostajesz 20 zł na kolejną sprawę.</div>`
      : '';

  const html = `<!doctype html><html lang="pl"><body style="margin:0;background:#f4efe3;font-family:Georgia,serif;color:#1c1a17">
<div style="max-width:600px;margin:0 auto;padding:32px 20px">
  <p style="font-family:'Courier New',monospace;letter-spacing:3px;font-size:12px;color:#8a6d33;text-transform:uppercase;margin:0">${esc(siteConfig.name)}</p>
  <h1 style="font-size:28px;margin:8px 0 16px">${isCard ? 'Karta podarunkowa kupiona' : 'Akta są twoje'}</h1>
  <p>${intro}</p>
  ${giftLine}
  ${isCard ? '' : `<p style="margin:24px 0"><a href="${accessUrl}" style="background:#1c1a17;color:#f7f1e3;padding:12px 22px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold">${hasPdf ? 'Pobierz materiały' : 'Otwórz akta'}</a></p>`}
  <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows}
    <tr><td style="padding:10px 0;font-weight:bold">Razem</td><td style="padding:10px 0;text-align:right;font-weight:bold">${formatPrice(order.total_grosze)}</td></tr>
  </table>
  ${isCard ? '' : `<p style="font-size:13px;color:#555;font-family:Arial,sans-serif">Wskazówka: wydrukuj akta i idź cel po celu. Wskazówki i odpowiedzi otwieraj dopiero wtedy, gdy będą potrzebne.</p>`}
  ${refBlock}

  <div style="margin-top:32px;padding:16px;background:#fff;border:1px solid #e0d6bf;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#333">
    <p style="margin:0 0 8px"><strong>Potwierdzenie zawarcia umowy</strong></p>
    <p style="margin:0 0 8px">Sprzedawca: ${esc(sellerIdentity())}, e-mail: ${esc(seller.email)}.</p>
    <p style="margin:0 0 8px">Data zamówienia: ${formatDate(order.created_at)}. Data dostarczenia treści cyfrowej: ${formatDate(order.paid_at)}.</p>
    ${isCard ? `<p style="margin:0 0 8px">Możesz odstąpić od umowy zakupu karty podarunkowej w ciągu 14 dni od zakupu, o ile karta nie została wykorzystana — wystarczy odpisać na tego maila. Szczegóły: ${siteConfig.url}/regulamin#rabaty.</p>` : `<p style="margin:0 0 8px">Przed złożeniem zamówienia (${formatDate(order.consent_digital_at)}) złożyłeś(-aś) oświadczenie: „${esc(DIGITAL_CONSENT_TEXT)}” W związku z tym, zgodnie z art. 38 ust. 1 pkt 13 ustawy o prawach konsumenta, prawo odstąpienia od umowy nie przysługuje. Uprawnienia z tytułu braku zgodności treści cyfrowej z umową pozostają bez zmian — szczegóły: ${siteConfig.url}/zwroty-i-reklamacje.</p>`}
    <p style="margin:16px 0 8px"><strong>Regulamin obowiązujący w dniu zakupu</strong></p>
    ${regulaminHtml()}
  </div>
</div></body></html>`;

  await sendEmail(order.email, isCard ? `Karta podarunkowa — zamówienie nr ${order.order_number}` : `Twoje akta są gotowe — zamówienie nr ${order.order_number}`, html);
}
