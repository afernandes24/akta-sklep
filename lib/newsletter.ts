import 'server-only';
import { siteConfig } from './config';
import { sendEmail } from './email';
import { seller, sellerIdentity } from './legal/seller';
import { createAdminClient } from './supabase/admin';

export const NEWSLETTER_CONSENT_TEXT =
  'Chcę otrzymywać newsletter z informacjami o nowych sprawach, promocjach i kodach rabatowych na podany adres e-mail. Mogę wypisać się w każdej chwili.';

/** Darmowa sprawa próbna — pliki w buckecie case-files pod free/000/ (wgrywa je npm run seed:files). */
export const FREE_CASE = {
  number: '000',
  title: 'Zegarek z Mariackiej',
  files: [
    { name: '01_INSTRUKCJA.pdf', label: 'Instrukcja' },
    { name: '02_AKTA_SPRAWY.pdf', label: 'Akta sprawy — etapy 1–3' },
    { name: '03_DOWODY.pdf', label: 'Dowody nr 1–9' },
    { name: '04_NOTATNIK_DETEKTYWA.pdf', label: 'Notatnik detektywa' },
    { name: '05_ROZWIAZANIE.pdf', label: 'Rozwiązanie — otwórz na końcu', solution: true },
  ],
};

export type Subscriber = { id: string; email: string; status: 'pending' | 'confirmed' | 'unsubscribed'; token: string };

export async function getSubscriberByToken(token: string): Promise<Subscriber | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const { data } = await createAdminClient().from('newsletter_subscribers').select('id, email, status, token').eq('token', token).maybeSingle();
  return (data as Subscriber | null) ?? null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function layout(title: string, body: string, token: string) {
  return `<!doctype html><html lang="pl"><body style="margin:0;background:#f4efe3;font-family:Georgia,serif;color:#1c1a17">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
  <p style="font-family:'Courier New',monospace;letter-spacing:3px;font-size:12px;color:#8a6d33;text-transform:uppercase;margin:0">${esc(siteConfig.name)}</p>
  <h1 style="font-size:26px;margin:8px 0 16px">${esc(title)}</h1>
  ${body}
  <p style="margin-top:32px;font-family:Arial,sans-serif;font-size:11px;color:#777;line-height:1.5">
    Otrzymujesz tę wiadomość, bo ktoś podał ten adres w formularzu na ${esc(siteConfig.url)}.
    <a href="${siteConfig.url}/newsletter/wypisz?token=${token}" style="color:#777">Wypisz się</a>.<br>
    ${esc(sellerIdentity())} · ${esc(seller.email)}
  </p>
</div></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="background:#1c1a17;color:#f7f1e3;padding:12px 22px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold">${esc(label)}</a></p>`;

export function sendConfirmationEmail(email: string, token: string) {
  const url = `${siteConfig.url}/newsletter/potwierdz?token=${token}`;
  return sendEmail(
    email,
    'Potwierdź zapis — i odbierz darmową sprawę',
    layout(
      'Jeszcze jeden krok',
      `<p>Kliknij, aby potwierdzić zapis do newslettera. Zaraz potem pobierzesz darmową sprawę <strong>AKTA #${FREE_CASE.number} — ${esc(FREE_CASE.title)}</strong>.</p>${button(url, 'Potwierdzam i pobieram sprawę')}<p style="font-family:Arial,sans-serif;font-size:13px;color:#555">Jeśli to nie ty — zignoruj tę wiadomość. Bez potwierdzenia nie wyślemy nic więcej.</p>`,
      token,
    ),
  );
}

export function sendFreeCaseEmail(email: string, token: string) {
  const url = `${siteConfig.url}/newsletter/potwierdz?token=${token}`;
  return sendEmail(
    email,
    `Twoja darmowa sprawa: AKTA #${FREE_CASE.number}`,
    layout(
      'Akta czekają',
      `<p>Dziękujemy za zapis! Pliki sprawy <strong>${esc(FREE_CASE.title)}</strong> pobierzesz w każdej chwili pod tym linkiem:</p>${button(url, 'Pobierz sprawę próbną')}<p style="font-family:Arial,sans-serif;font-size:13px;color:#555">Wydrukuj pliki 01–04, a rozwiązanie otwórz na końcu. Powodzenia, detektywie.</p>`,
      token,
    ),
  );
}
