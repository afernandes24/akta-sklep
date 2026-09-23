import 'server-only';
import { siteConfig } from './config';
import { formatDate, formatPrice } from './format';
import { type Block, DIGITAL_CONSENT_TEXT, regulamin } from './legal/documents';
import { seller, sellerIdentity } from './legal/seller';
import { createAdminClient } from './supabase/admin';

/**
 * Wysyłka e-maili przez Resend (https://resend.com) — bez dodatkowych bibliotek.
 * Wymaga RESEND_API_KEY i EMAIL_FROM. Bez nich e-mail jest tylko logowany.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.warn(`[email] Pominięto wysyłkę „${subject}” do ${to} — brak RESEND_API_KEY / EMAIL_FROM`);
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, reply_to: seller.email.startsWith('[') ? undefined : seller.email }),
  });
  if (!res.ok) console.error('[email] Resend', res.status, await res.text().catch(() => ''));
  return res.ok;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
    .select('id, order_number, email, total_grosze, discount_grosze, discount_label, created_at, paid_at, consent_digital_at, order_items(title, price_grosze, list_price_grosze)')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return;

  const items = (order.order_items ?? []) as { title: string; price_grosze: number; list_price_grosze: number | null }[];
  const discount = (order.discount_grosze as number | null) ?? 0;
  const rows =
    items
      .map(
        (i) =>
          `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${esc(i.title)} (PDF)</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(discount ? (i.list_price_grosze ?? i.price_grosze) : i.price_grosze)}</td></tr>`,
      )
      .join('') +
    (discount
      ? `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;color:#2d6a3e">${esc(String(order.discount_label ?? 'Rabat'))}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;color:#2d6a3e">−${formatPrice(discount)}</td></tr>`
      : '');

  const html = `<!doctype html><html lang="pl"><body style="margin:0;background:#f4efe3;font-family:Georgia,serif;color:#1c1a17">
<div style="max-width:600px;margin:0 auto;padding:32px 20px">
  <p style="font-family:'Courier New',monospace;letter-spacing:3px;font-size:12px;color:#8a6d33;text-transform:uppercase;margin:0">${esc(siteConfig.name)}</p>
  <h1 style="font-size:28px;margin:8px 0 16px">Akta są twoje</h1>
  <p>Dziękujemy za zakup! Płatność za zamówienie <strong>nr ${order.order_number}</strong> została potwierdzona. Pliki PDF czekają na twoim koncie:</p>
  <p style="margin:24px 0"><a href="${siteConfig.url}/konto/sprawy" style="background:#1c1a17;color:#f7f1e3;padding:12px 22px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold">Pobierz materiały</a></p>
  <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows}
    <tr><td style="padding:10px 0;font-weight:bold">Razem</td><td style="padding:10px 0;text-align:right;font-weight:bold">${formatPrice(order.total_grosze)}</td></tr>
  </table>
  <p style="font-size:13px;color:#555;font-family:Arial,sans-serif">Wskazówka: wydrukuj pliki 01–04. Plik z rozwiązaniem otwórz dopiero na końcu śledztwa.</p>

  <div style="margin-top:32px;padding:16px;background:#fff;border:1px solid #e0d6bf;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#333">
    <p style="margin:0 0 8px"><strong>Potwierdzenie zawarcia umowy</strong></p>
    <p style="margin:0 0 8px">Sprzedawca: ${esc(sellerIdentity())}, e-mail: ${esc(seller.email)}.</p>
    <p style="margin:0 0 8px">Data zamówienia: ${formatDate(order.created_at)}. Data dostarczenia treści cyfrowej: ${formatDate(order.paid_at)}.</p>
    <p style="margin:0 0 8px">Przed złożeniem zamówienia (${formatDate(order.consent_digital_at)}) złożyłeś(-aś) oświadczenie: „${esc(DIGITAL_CONSENT_TEXT)}” W związku z tym, zgodnie z art. 38 ust. 1 pkt 13 ustawy o prawach konsumenta, prawo odstąpienia od umowy nie przysługuje. Uprawnienia z tytułu braku zgodności treści cyfrowej z umową pozostają bez zmian — szczegóły: ${siteConfig.url}/zwroty-i-reklamacje.</p>
    <p style="margin:16px 0 8px"><strong>Regulamin obowiązujący w dniu zakupu</strong></p>
    ${regulaminHtml()}
  </div>
</div></body></html>`;

  await sendEmail(order.email, `Twoje akta są gotowe do pobrania — zamówienie nr ${order.order_number}`, html);
}
