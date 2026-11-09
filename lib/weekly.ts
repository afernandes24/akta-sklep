import 'server-only';
import { publicStorageUrl, siteConfig } from './config';
import { getSubscribers, type Subscriber } from './campaign';
import { sendEmail } from './email';
import { formatPrice } from './format';
import { loadPromo, type Promo } from './followup';
import { sellerIdentity } from './legal/seller';
import { VOLUME_TIERS } from './pricing';
import { createAdminClient } from './supabase/admin';

/**
 * NEWSLETTER CO TYDZIEŃ — „Sprawa tygodnia”.
 * Co tydzień inna sprawa na pierwszym planie + porada detektywa + (opcjonalnie) kod rabatowy.
 * Wysyłka sama, w wybrany dzień i godzinę (Admin → Maile). Każdy subskrybent dostaje dany tydzień raz
 * (tabela newsletter_sends, kampania = „TYDZIEN-2026-46”).
 */

const SIGNATURE = process.env.FOLLOWUP_SIGNATURE || 'Aleksander';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DAYS = ['', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'];
export const dayName = (d: number) => DAYS[d] ?? '';

export interface WeeklySettings {
  auto: boolean;
  code: string;
  dow: number; // 1 = poniedziałek … 7 = niedziela
  hour: number;
}
const DEFAULTS: WeeklySettings = { auto: false, code: '', dow: 4, hour: 18 };

export async function getWeeklySettings(): Promise<WeeklySettings & { ready: boolean }> {
  const { data, error } = await createAdminClient().from('site_settings').select('weekly_auto, weekly_code, weekly_dow, weekly_hour').eq('id', 1).maybeSingle();
  if (error || !data) return { ...DEFAULTS, ready: !error };
  return {
    auto: Boolean(data.weekly_auto),
    code: String(data.weekly_code ?? ''),
    dow: Number(data.weekly_dow ?? DEFAULTS.dow),
    hour: Number(data.weekly_hour ?? DEFAULTS.hour),
    ready: true,
  };
}

/** Czas polski: numer tygodnia ISO, dzień tygodnia (1–7) i godzina. */
export function warsawNow(at = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false })
      .formatToParts(at)
      .map((x) => [x.type, x.value]),
  );
  const d = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow); // czwartek tego tygodnia wyznacza rok ISO
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
  return { year: d.getUTCFullYear(), week, dow, hour: Number(p.hour) % 24 };
}

export const weekKey = (at = new Date()) => {
  const w = warsawNow(at);
  return `TYDZIEN-${w.year}-${String(w.week).padStart(2, '0')}`;
};

type WeeklyCase = {
  slug: string;
  title: string;
  tagline: string;
  price_grosze: number;
  cover_path: string | null;
  case_number: string;
  difficulty: number;
  play_time_minutes: number;
  suspect_count: number;
  city?: string | null;
};

export async function loadWeeklyCases(): Promise<WeeklyCase[]> {
  const db = createAdminClient();
  const base = 'slug, title, tagline, price_grosze, cover_path, case_number, difficulty, play_time_minutes, suspect_count';
  let res: { data: unknown; error: unknown } = await db.from('cases').select(base + ', city').eq('is_published', true).order('sort_order');
  if (res.error) res = await db.from('cases').select(base).eq('is_published', true).order('sort_order');
  return (res.data ?? []) as unknown as WeeklyCase[];
}

/** Porady detektywa — co tydzień inna, żeby mail nie był powtórką. */
const TIPS = [
  ['Zacznij od osi czasu', 'Zanim zaczniesz podejrzewać, rozpisz na kartce, kto był gdzie i o której. Połowa kłamstw wychodzi, kiedy dwie godziny się nie zgadzają.'],
  ['Szukaj tego, czego brakuje', 'Najciekawsze bywa nie to, co jest w aktach, ale to, czego tam nie ma: brakujący telefon, nieodebrany list, pusty kubek.'],
  ['Motyw, środki, okazja', 'Stara szkoła śledczych: dla każdego podejrzanego zrób trzy kolumny. Kto ma wszystkie trzy, trafia na górę listy.'],
  ['Czytaj zeznania dwa razy', 'Za pierwszym razem czytasz historię. Za drugim — szczegóły: kto mówi „chyba”, kto podaje godzinę co do minuty, a kto zmienia temat.'],
  ['Nie bój się wskazówek', 'Wskazówki są ułożone od najsłabszej do najmocniejszej. Pierwsza tylko popycha w dobrą stronę — niczego nie zdradza.'],
  ['Graj z kimś, kto myśli inaczej', 'Najlepsze śledztwa to te, w których ktoś się kłóci. Jedna osoba pilnuje faktów, druga wymyśla teorie — razem trafiacie szybciej.'],
  ['Zdjęcia mówią więcej, niż się wydaje', 'Zanim przejdziesz dalej, obejrzyj każde zdjęcie z miejsca zdarzenia przez minutę. Godzina na zegarze, odbicie w szybie, czyjś but w rogu kadru.'],
  ['Zrób tablicę śledczą', 'Wydrukowane akta, taśma i ściana albo duży karton. Przypinasz osoby, łączysz nitką — i nagle widać to, czego nie widać na stole.'],
];

const INTROS = [
  (t: string) => `W tym tygodniu na biurku leżą akta, do których mam słabość: <strong>„${t}”</strong>. Jeśli szukasz pomysłu na wieczór — to jest ten.`,
  (t: string) => `Krótko i konkretnie: sprawa tygodnia to <strong>„${t}”</strong>. Poniżej wszystko, co trzeba wiedzieć, zanim otworzysz akta.`,
  (t: string) => `Pytaliście, od czego zacząć, jeśli darmowa sprawa się spodobała. Moja odpowiedź na ten tydzień: <strong>„${t}”</strong>.`,
  (t: string) => `Długie wieczory sprzyjają śledztwom. W tym tygodniu polecam <strong>„${t}”</strong> — zaparz herbatę, wydrukuj akta i zacznij od pierwszego raportu.`,
];

function coverUrl(c: { cover_path: string | null }) {
  const img = publicStorageUrl('covers', c.cover_path);
  return img ? (img.startsWith('http') ? img : siteConfig.url + img) : null;
}

export function weeklyHtml(sub: Subscriber, key: string, cases: WeeklyCase[], promo: Promo | null): { subject: string; html: string } | null {
  if (!cases.length) return null;
  const n = Number(key.slice(-2)) || 0;
  const main = cases[n % cases.length];
  const others = cases.filter((c) => c.slug !== main.slug).slice(0, 3);
  const [tipTitle, tipText] = TIPS[n % TIPS.length];
  const intro = INTROS[n % INTROS.length](esc(main.title));
  const camp = key.toLowerCase();
  const q = `?${promo ? `kod=${encodeURIComponent(promo.code)}&` : ''}utm_source=mail&utm_medium=email&utm_campaign=${camp}`;
  const P = (t: string) => `<p style="font-size:16px;line-height:1.65;margin:0 0 16px">${t}</p>`;
  const time = main.play_time_minutes >= 120 ? `${(main.play_time_minutes / 60).toFixed(1).replace('.0', '').replace('.', ',')} h` : `${main.play_time_minutes} min`;
  const facts = [`Trudność ${main.difficulty}/5`, time, `${main.suspect_count} podejrzanych`, main.city ? esc(main.city) : null].filter(Boolean).join(' · ');
  const img = coverUrl(main);
  const top = VOLUME_TIERS[0];

  const offer = promo
    ? `<div style="margin:24px 0;padding:22px;background:#1c1a17;border-radius:10px;text-align:center;color:#f4efe3">
        <p style="font-family:'Courier New',monospace;letter-spacing:3px;font-size:11px;color:#d4b06a;margin:0;text-transform:uppercase">Tylko dla subskrybentów${promo.until ? ` · do ${esc(promo.until)}` : ''}</p>
        <p style="font-size:24px;font-weight:bold;margin:8px 0 12px">${esc(promo.label.charAt(0).toUpperCase() + promo.label.slice(1))}</p>
        <div style="display:inline-block;border:2px dashed #d4b06a;padding:8px 20px;font-family:'Courier New',monospace;font-size:22px;letter-spacing:4px;color:#d4b06a;font-weight:bold">${esc(promo.code)}</div>
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#a89f8d;margin:12px 0 0">Kod wpisze się sam, jeśli wejdziesz przez link z tego maila.</p>
      </div>`
    : `<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;background:#f3ecdc;border-radius:8px;padding:14px 16px;margin:22px 0;text-align:center">💡 Kupujesz ${top.minItems} sprawy? Rabat <strong>−${top.percent}%</strong> nalicza się sam w koszyku.</p>`;

  const cell = (r: WeeklyCase) => {
    const src = coverUrl(r);
    return `<td style="width:33%;padding:6px;vertical-align:top;text-align:center">
      <a href="${siteConfig.url}/sprawy/${r.slug}${q}" style="text-decoration:none;color:#1c1a17">
        ${src ? `<img src="${esc(src)}" alt="${esc(r.title)}" width="150" style="width:100%;max-width:150px;border-radius:6px;display:block;margin:0 auto 8px">` : ''}
        <div style="font-size:14px;font-weight:bold;line-height:1.25">${esc(r.title)}</div>
        <div style="font-family:Arial,sans-serif;font-size:12px;color:#666;margin-top:3px">${formatPrice(r.price_grosze)}</div>
      </a></td>`;
  };

  const html = `<!doctype html><html lang="pl"><head><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#efe8d8;font-family:Georgia,serif;color:#1c1a17">
<div style="display:none;max-height:0;overflow:hidden">Sprawa tygodnia: ${esc(main.title)} — ${esc(main.tagline)}</div>
<div style="max-width:600px;margin:0 auto;padding:28px 14px">
  <p style="text-align:center;font-family:'Courier New',monospace;letter-spacing:4px;font-size:12px;color:#8a6d33;text-transform:uppercase;margin:0 0 14px">🔍 ${esc(siteConfig.name)} · sprawa tygodnia</p>
  <div style="background:#fbf8f1;border:1px solid #e0d6bf;border-radius:12px;padding:30px 26px;box-shadow:0 2px 0 #e0d6bf">
    <h1 style="font-size:24px;margin:0 0 16px">Cześć, detektywie!</h1>
    ${P(intro)}
    <a href="${siteConfig.url}/sprawy/${main.slug}${q}" style="display:block;text-decoration:none;color:#1c1a17;margin:22px 0;border:1px solid #e0d6bf;border-radius:10px;overflow:hidden;background:#fff">
      ${img ? `<img src="${esc(img)}" alt="${esc(main.title)}" width="546" style="width:100%;display:block">` : ''}
      <div style="padding:18px 20px">
        <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;color:#8a6d33">AKTA #${esc(main.case_number)}</div>
        <div style="font-size:24px;font-weight:bold;margin:4px 0 6px">${esc(main.title)}</div>
        <div style="font-size:15px;line-height:1.55;color:#3b362e">${esc(main.tagline)}</div>
        <div style="font-family:Arial,sans-serif;font-size:13px;color:#777;margin-top:10px">${facts}</div>
        <div style="margin-top:14px"><span style="background:#1c1a17;color:#d4b06a;padding:10px 20px;border-radius:6px;font-family:Arial,sans-serif;font-weight:bold;display:inline-block">Otwórz akta · ${formatPrice(main.price_grosze)}</span></div>
      </div>
    </a>
    ${offer}
    <div style="border-left:3px solid #d4b06a;padding:4px 0 4px 16px;margin:24px 0">
      <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;color:#8a6d33;margin:0 0 6px;text-transform:uppercase">Porada detektywa: ${esc(tipTitle)}</p>
      <p style="font-size:15px;line-height:1.6;margin:0">${esc(tipText)}</p>
    </div>
    ${others.length ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#666;margin:0 0 6px;text-align:center">Inne sprawy w archiwum:</p><table role="presentation" style="width:100%;border-collapse:collapse"><tr>${others.map(cell).join('')}</tr></table>` : ''}
    <p style="font-size:16px;line-height:1.6;margin:22px 0 0">Masz pytanie albo rozwiązałeś(-aś) sprawę i chcesz się pochwalić? Po prostu odpisz — czytam wszystko sam.</p>
    <p style="font-size:16px;line-height:1.5;margin:14px 0 0"><span style="font-size:20px;font-style:italic">${esc(SIGNATURE)}</span><br><span style="color:#777;font-size:14px">twórca Akt Detektywa</span></p>
  </div>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#8f877a;line-height:1.5;margin:18px 6px 0;text-align:center">Dostajesz tę wiadomość, bo zapisałeś(-aś) się do newslettera ${esc(siteConfig.name)}. <a href="${siteConfig.url}/newsletter/wypisz?token=${encodeURIComponent(sub.token)}" style="color:#888">Wypisz się</a>.<br>${esc(sellerIdentity())}</p>
</div></body></html>`;
  const subjects = [
    `Sprawa tygodnia: „${main.title}” 🔍`,
    `Na ten wieczór: „${main.title}”`,
    `${main.title} — akta czekają na ciebie`,
    `Nowe śledztwo na weekend: „${main.title}”`,
  ];
  return { subject: subjects[n % subjects.length] + (promo ? ` + ${promo.label}` : ''), html };
}

/** Wysyła newsletter tygodnia tym, którzy go jeszcze nie dostali. */
export async function sendWeekly(opts: { key: string; code: string; limit: number; confirmedBefore?: number }) {
  const db = createAdminClient();
  const [subs, cases, promo, sent] = await Promise.all([
    getSubscribers(true),
    loadWeeklyCases(),
    opts.code ? loadPromo(opts.code) : Promise.resolve(null),
    db.from('newsletter_sends').select('email').eq('campaign', opts.key).limit(50000),
  ]);
  if (sent.error) return { ready: false, sent: 0, failed: 0, left: 0 };
  const done = new Set((sent.data ?? []).map((r) => String(r.email).toLowerCase()));
  // Świeżo zapisani (ostatnie 2 dni) właśnie dostali darmową sprawę — newsletter dostaną od kolejnego tygodnia
  const todo = subs.filter(
    (s) => !done.has(s.email.toLowerCase()) && !(opts.confirmedBefore && s.confirmed_at && new Date(s.confirmed_at).getTime() > opts.confirmedBefore),
  );
  let ok = 0, failed = 0;
  for (const s of todo.slice(0, opts.limit)) {
    const mail = weeklyHtml(s, opts.key, cases, promo);
    if (!mail) break;
    const { error } = await db.from('newsletter_sends').insert({ campaign: opts.key, email: s.email.toLowerCase() });
    if (error) continue;
    if (await sendEmail(s.email, mail.subject, mail.html).catch(() => false)) ok++;
    else {
      failed++;
      await db.from('newsletter_sends').delete().eq('campaign', opts.key).eq('email', s.email.toLowerCase());
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return { ready: true, sent: ok, failed, left: Math.max(0, todo.length - opts.limit) };
}

let lastRun = 0;
/** Wywoływane przy okazji ruchu na stronie (jak maile po zakupie) — najwyżej raz na 20 minut. */
export function maybeRunWeekly() {
  if (Date.now() - lastRun < 20 * 60 * 1000) return;
  lastRun = Date.now();
  void (async () => {
    try {
      const s = await getWeeklySettings();
      if (!s.ready || !s.auto) return;
      const now = warsawNow();
      if (now.dow * 24 + now.hour < s.dow * 24 + s.hour) return; // jeszcze nie pora w tym tygodniu
      const r = await sendWeekly({ key: weekKey(), code: s.code, limit: 40, confirmedBefore: Date.now() - 2 * 864e5 });
      if (r.sent || r.failed) console.log('[newsletter] tydzień', r);
    } catch (e) {
      console.error('[newsletter] tydzień', e);
    }
  })();
}
