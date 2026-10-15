import 'server-only';
import { siteConfig } from './config';
import { byKindThenName, fileKind, labelFromFileName, type FileKind } from './files';
import { sendEmail } from './email';
import { seller, sellerIdentity } from './legal/seller';
import { createAdminClient } from './supabase/admin';

export const NEWSLETTER_CONSENT_TEXT =
  'Chcę otrzymywać newsletter z informacjami o nowych sprawach, promocjach i kodach rabatowych na podany adres e-mail. Mogę wypisać się w każdej chwili.';

/**
 * Darmowa sprawa próbna (newsletter). Pliki PDF wgrywasz w panelu: Admin → Darmowa sprawa
 * (bucket case-files, folder free/000/). Opis na stronie /darmowa-sprawa zmieniasz TUTAJ.
 */
export const FREE_CASE = {
  number: '000',
  title: 'Tajemnica spowiedzi',
  /** Okładka z pliku w public/ (ścieżka zaczynająca się od „/”). */
  cover: '/darmowa-sprawa/okladka-tajemnica-spowiedzi.jpg',
  lead: 'Wigilia 1994 roku. Śnieżyca odcina Opactwo św. Wawrzyńca pod Gorlicami od świata i zrywa linię — przez prawie półtorej godziny w budynku nie ma prądu. Przed pasterką nowicjusz znajduje w bibliotece martwego ojca Józefa, bibliotekarza i spowiednika. Ciało leży u stóp drabiny przy szafie z najcenniejszymi starodrukami. Lekarz-gość orzeka nieszczęśliwy wypadek, lekarz sądowy twierdzi co innego. Razem z kom. Anną Pawlak przejrzysz protokoły, zapiski ofiary i dowody, rozgryziesz szyfr i ustalisz, kto tej nocy mówi prawdę.',
  teaser: 'Krótka sprawa na 45–60 minut: Wigilia 1994, opactwo odcięte śnieżycą i martwy spowiednik u stóp drabiny.',
  seoDescription: 'Wigilia 1994, opactwo odcięte śnieżycą, bibliotekarz martwy w bibliotece. Darmowa gra detektywistyczna PDF do druku: 3 cele, 45–60 minut.',
  bullets: ['3 cele śledztwa', '4 podejrzanych', 'Szyfr i stare ex-librisy do rozgryzienia', '45–60 minut, 1–6 osób, 16+', 'Wskazówki i odpowiedzi w osobnych plikach', 'PDF do wydrukowania w domu'],
};

export const FREE_CASE_FOLDER = `free/${FREE_CASE.number}`;

export interface FreeFile {
  name: string;
  label: string;
  kind: FileKind;
  size?: number;
}

/** Pliki darmowej sprawy — czytane z magazynu, więc wystarczy je podmienić w panelu. */
export async function listFreeFiles(): Promise<FreeFile[]> {
  const { data } = await createAdminClient()
    .storage.from('case-files')
    .list(FREE_CASE_FOLDER, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
  return (data ?? [])
    .filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    .map((f) => ({ name: f.name, label: labelFromFileName(f.name), kind: fileKind(f.name), size: (f.metadata as { size?: number } | null)?.size }))
    .sort(byKindThenName);
}

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
      `<p>Dziękujemy za zapis! Pliki sprawy <strong>${esc(FREE_CASE.title)}</strong> pobierzesz w każdej chwili pod tym linkiem:</p>${button(url, 'Pobierz sprawę próbną')}<p style="font-family:Arial,sans-serif;font-size:13px;color:#555">Wydrukuj akta i zacznij od instrukcji. Wskazówki i odpowiedzi otwieraj dopiero wtedy, gdy będą potrzebne. Powodzenia, detektywie.</p>`,
      token,
    ),
  );
}
