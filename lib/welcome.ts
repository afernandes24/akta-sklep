import 'server-only';
import { createHash } from 'node:crypto';
import { getSubscribers, type Subscriber } from './campaign';
import { publicStorageUrl, siteConfig } from './config';
import { sendEmail } from './email';
import { formatPrice } from './format';
import { sellerIdentity } from './legal/seller';
import { createAdminClient } from './supabase/admin';
import { loadWeeklyCases } from './weekly';
import { marketingAllowance } from './email-budget';

/**
 * SERIA POWITALNA — dla osób, które zapisały się po darmową sprawę i jeszcze nic nie kupiły.
 *   Mail 1 (2 dni po potwierdzeniu): „Jak poszło śledztwo?” + osobisty kod −30% na pierwszą sprawę, ważny 72 h.
 *   Mail 2 (ok. 2 dni później): „Twój kod wygasa jutro” + bestseller i pakiet.
 * Każdy dostaje każdy mail raz (tabela newsletter_sends, kampanie SERIA-1 / SERIA-2).
 * Kupujący nie dostają serii (mają swój mail po zakupie). Wyłącznik: zmienna WELCOME_EMAILS=off w Railway.
 */

const SIGNATURE = process.env.FOLLOWUP_SIGNATURE || 'Aleksander';
const PERCENT = 30;
const CODE_HOURS = 72;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const H = 36e5;

/** Osobisty kod — zawsze ten sam dla danego maila (mail 2 przypomina kod z maila 1). */
export function welcomeCode(email: string) {
  const h = createHash('sha256').update(`akta-start:${email.toLowerCase()}`).digest('hex');
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 5; i++) out += abc[parseInt(h.slice(i * 2, i * 2 + 2), 16) % abc.length];
  return `START${out}`;
}

type WCase = Awaited<ReturnType<typeof loadWeeklyCases>>[number];

function cover(c: WCase) {
  const img = publicStorageUrl('covers', c.cover_path);
  return img ? (img.startsWith('http') ? img : siteConfig.url + img) : null;
}

/** Polecane na start: Pusty grób, Martwi nie wracają, Kolacja w ciemności (a jak ich nie ma — pierwsze z katalogu). */
function picks(cases: WCase[]): WCase[] {
  const want = ['pusty', 'martwi', 'kolacja'];
  const chosen = want.map((w) => cases.find((c) => c.slug.includes(w) || c.title.toLowerCase().includes(w))).filter(Boolean) as WCase[];
  for (const c of cases) if (chosen.length < 3 && !chosen.includes(c)) chosen.push(c);
  return chosen.slice(0, 3);
}

function shell(sub: Subscriber, preheader: string, body: string) {
  return `<!doctype html><html lang="pl"><head><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#efe8d8;font-family:Georgia,serif;color:#1c1a17">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<div style="max-width:600px;margin:0 auto;padding:28px 14px">
  <p style="text-align:center;font-family:'Courier New',monospace;letter-spacing:4px;font-size:12px;color:#8a6d33;text-transform:uppercase;margin:0 0 14px">🔍 ${esc(siteConfig.name)}</p>
  <div style="background:#fbf8f1;border:1px solid #e0d6bf;border-radius:12px;padding:30px 26px;box-shadow:0 2px 0 #e0d6bf">
    ${body}
    <p style="font-size:16px;line-height:1.5;margin:18px 0 0"><span style="font-size:20px;font-style:italic">${esc(SIGNATURE)}</span><br><span style="color:#777;font-size:14px">twórca Akt Detektywa</span></p>
  </div>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#8f877a;line-height:1.5;margin:18px 6px 0;text-align:center">Dostajesz tę wiadomość, bo zapisałeś(-aś) się do newslettera ${esc(siteConfig.name)} po darmową sprawę. <a href="${siteConfig.url}/newsletter/wypisz?token=${encodeURIComponent(sub.token)}" style="color:#888">Wypisz się</a>.<br>${esc(sellerIdentity())}</p>
</div></body></html>`;
}

const P = (t: string) => `<p style="font-size:16px;line-height:1.65;margin:0 0 16px">${t}</p>`;
const btn = (href: string, label: string) =>
  `<a href="${href}" style="background:#1c1a17;color:#d4b06a;padding:12px 24px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;display:inline-block">${label}</a>`;

function codeBox(code: string, until: string) {
  return `<div style="margin:22px 0;padding:22px;background:#1c1a17;border-radius:10px;text-align:center;color:#f4efe3">
    <p style="font-family:'Courier New',monospace;letter-spacing:3px;font-size:11px;color:#d4b06a;margin:0;text-transform:uppercase">Twój kod na pierwszą sprawę · do ${esc(until)}</p>
    <p style="font-size:24px;font-weight:bold;margin:8px 0 12px">−${PERCENT}% na dowolną sprawę</p>
    <div style="display:inline-block;border:2px dashed #d4b06a;padding:8px 20px;font-family:'Courier New',monospace;font-size:22px;letter-spacing:4px;color:#d4b06a;font-weight:bold">${esc(code)}</div>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#a89f8d;margin:12px 0 0">Kod wpisze się sam, jeśli wejdziesz przez link z tego maila. Jeden raz, tylko dla Ciebie.</p>
  </div>`;
}

export function welcomeHtml(step: 1 | 2, sub: Subscriber, cases: WCase[], until: string): { subject: string; html: string } | null {
  const top = picks(cases);
  if (!top.length) return null;
  const code = welcomeCode(sub.email);
  const q = (camp: string) => `?kod=${encodeURIComponent(code)}&utm_source=mail&utm_medium=email&utm_campaign=${camp}`;

  if (step === 1) {
    const qs = q('seria-1');
    const cell = (c: WCase) => {
      const src = cover(c);
      const price = Math.round((c.price_grosze * (100 - PERCENT)) / 100);
      return `<td style="width:33%;padding:6px;vertical-align:top;text-align:center">
        <a href="${siteConfig.url}/sprawy/${c.slug}${qs}" style="text-decoration:none;color:#1c1a17">
          ${src ? `<img src="${esc(src)}" alt="${esc(c.title)}" width="150" style="width:100%;max-width:150px;border-radius:6px;display:block;margin:0 auto 8px">` : ''}
          <div style="font-size:14px;font-weight:bold;line-height:1.25">${esc(c.title)}</div>
          <div style="font-family:Arial,sans-serif;font-size:12px;margin-top:3px"><s style="color:#999">${formatPrice(c.price_grosze)}</s> <strong>${formatPrice(price)}</strong></div>
        </a></td>`;
    };
    const body = `
    <h1 style="font-size:24px;margin:0 0 16px">Jak poszło śledztwo, detektywie?</h1>
    ${P('Niedawno dostałeś(-aś) ode mnie akta <strong>„Tajemnicy spowiedzi”</strong>. Udało się wskazać sprawcę?')}
    ${P('Jeśli utknąłeś(-aś) — plik <strong>03 Wskazówki</strong> popycha krok po kroku, niczego nie zdradzając od razu. Pełne rozwiązanie jest w pliku <strong>04 Odpowiedzi</strong>.')}
    ${P('A jeśli wciągnęło — w archiwum czekają dłuższe i trudniejsze sprawy. Na pierwszą z nich mam dla Ciebie kod:')}
    ${codeBox(code, until)}
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#666;margin:0 0 6px;text-align:center">Od tych spraw najczęściej zaczynają gracze:</p>
    <table role="presentation" style="width:100%;border-collapse:collapse"><tr>${top.map(cell).join('')}</tr></table>
    <p style="text-align:center;margin:20px 0 6px">${btn(`${siteConfig.url}/sprawy${qs}`, 'Zobacz wszystkie sprawy')}</p>
    ${P('<br>Odpisz, jak poszło z „Tajemnicą spowiedzi” — czytam każdą wiadomość sam.')}`;
    return { subject: 'Jak poszło śledztwo w opactwie? 🕯️ (+ kod −30%)', html: shell(sub, `Udało się wskazać sprawcę? Mam dla Ciebie kod −${PERCENT}% na pierwszą sprawę.`, body) };
  }

  const qs = q('seria-2');
  const main = top[0];
  const img = cover(main);
  const price = Math.round((main.price_grosze * (100 - PERCENT)) / 100);
  const body = `
    <h1 style="font-size:24px;margin:0 0 16px">Twój kod wygasa jutro</h1>
    ${P(`Krótkie przypomnienie: kod <strong>${esc(code)}</strong> (−${PERCENT}% na pierwszą sprawę) działa tylko do <strong>${esc(until)}</strong>.`)}
    ${P('Jeśli nie wiesz, od czego zacząć — weź tę, którą kupuje najwięcej osób:')}
    <a href="${siteConfig.url}/sprawy/${main.slug}${qs}" style="display:block;text-decoration:none;color:#1c1a17;margin:20px 0;border:1px solid #e0d6bf;border-radius:10px;overflow:hidden;background:#fff">
      ${img ? `<img src="${esc(img)}" alt="${esc(main.title)}" width="546" style="width:100%;display:block">` : ''}
      <div style="padding:18px 20px">
        <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;color:#8a6d33">AKTA #${esc(main.case_number)} · BESTSELLER</div>
        <div style="font-size:24px;font-weight:bold;margin:4px 0 6px">${esc(main.title)}</div>
        <div style="font-size:15px;line-height:1.55;color:#3b362e">${esc(main.tagline)}</div>
        <div style="margin-top:14px"><span style="background:#1c1a17;color:#d4b06a;padding:10px 20px;border-radius:6px;font-family:Arial,sans-serif;font-weight:bold;display:inline-block">Otwórz akta · <s style="opacity:.6">${formatPrice(main.price_grosze)}</s> ${formatPrice(price)}</span></div>
      </div>
    </a>
    ${P(`Wolisz od razu kilka spraw? Przy 2 i więcej rabat nalicza się sam w koszyku — <a href="${siteConfig.url}/sprawy${qs}#pakiety-sekcja" style="color:#8a6d33">zobacz pakiety</a>. Koszyk wybierze korzystniejszy rabat.`)}`;
  return { subject: `Twój kod −${PERCENT}% wygasa jutro ⏳`, html: shell(sub, `Kod ${code} działa tylko do ${until}.`, body) };
}

const fmtUntil = (d: Date) =>
  new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' }).format(d);

/** Wysyła zaległe maile serii. Zwraca liczby do logów. */
export async function sendWelcomeSeries(limit = 30) {
  const db = createAdminClient();
  const now = Date.now();
  const [subs, sends, buyersRes, cases] = await Promise.all([
    getSubscribers(true),
    db.from('newsletter_sends').select('campaign, email, sent_at').in('campaign', ['SERIA-1', 'SERIA-2']).limit(50000),
    db.from('orders').select('email').eq('status', 'paid').limit(50000),
    loadWeeklyCases(),
  ]);
  if (sends.error || buyersRes.error || !cases.length) return { ready: false, s1: 0, s2: 0 };
  const buyers = new Set((buyersRes.data ?? []).map((o) => String(o.email ?? '').toLowerCase()));
  const s1 = new Map<string, number>();
  const s2 = new Set<string>();
  for (const r of sends.data ?? []) {
    const e = String(r.email).toLowerCase();
    if (r.campaign === 'SERIA-1') s1.set(e, new Date(r.sent_at as string).getTime());
    else s2.add(e);
  }
  let sent1 = 0, sent2 = 0;
  // Limit Resend: równomiernie, z rezerwą na zakupy (lib/email-budget.ts)
  let budget = Math.min(limit, await marketingAllowance());

  for (const s of subs) {
    if (budget <= 0) break;
    const email = s.email.toLowerCase();
    if (buyers.has(email) || !s.confirmed_at) continue;
    const age = now - new Date(s.confirmed_at).getTime();

    // Mail 1: 2–14 dni po potwierdzeniu
    if (!s1.has(email) && age >= 48 * H && age <= 14 * 24 * H) {
      const validUntil = new Date(now + CODE_HOURS * H);
      const { error: codeErr } = await db.from('discount_codes').upsert(
        {
          code: welcomeCode(email),
          percent_off: PERCENT,
          min_items: 1,
          valid_until: validUntil.toISOString(),
          max_uses: 1,
          one_per_user: true,
          is_active: true,
          note: `Seria powitalna — ${email}`,
        },
        { onConflict: 'code' },
      );
      if (codeErr) {
        console.error('[seria] kod', codeErr.message);
        return { ready: false, s1: sent1, s2: sent2 };
      }
      const mail = welcomeHtml(1, s, cases, fmtUntil(validUntil));
      if (!mail) break;
      const { error } = await db.from('newsletter_sends').insert({ campaign: 'SERIA-1', email });
      if (error) continue;
      budget--;
      if (await sendEmail(s.email, mail.subject, mail.html, undefined, 'marketing').catch(() => false)) sent1++;
      else await db.from('newsletter_sends').delete().eq('campaign', 'SERIA-1').eq('email', email);
      await new Promise((r) => setTimeout(r, 600));
      continue;
    }

    // Mail 2: ok. 44 h po mailu 1, póki kod jeszcze ważny (ostatnia doba)
    const at1 = s1.get(email);
    if (at1 && !s2.has(email) && now - at1 >= 44 * H && now - at1 <= (CODE_HOURS - 6) * H) {
      const mail = welcomeHtml(2, s, cases, fmtUntil(new Date(at1 + CODE_HOURS * H)));
      if (!mail) break;
      const { error } = await db.from('newsletter_sends').insert({ campaign: 'SERIA-2', email });
      if (error) continue;
      budget--;
      if (await sendEmail(s.email, mail.subject, mail.html, undefined, 'marketing').catch(() => false)) sent2++;
      else await db.from('newsletter_sends').delete().eq('campaign', 'SERIA-2').eq('email', email);
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  return { ready: true, s1: sent1, s2: sent2 };
}

let lastRun = 0;
/** Wywoływane przy ruchu na stronie (jak newsletter tygodniowy) — najwyżej raz na 20 minut. */
export function maybeRunWelcome() {
  if (process.env.WELCOME_EMAILS === 'off') return;
  if (Date.now() - lastRun < 20 * 60 * 1000) return;
  lastRun = Date.now();
  void (async () => {
    try {
      const r = await sendWelcomeSeries(30);
      if (r.s1 || r.s2) console.log('[seria] wysłane', r);
    } catch (e) {
      console.error('[seria]', e);
    }
  })();
}
