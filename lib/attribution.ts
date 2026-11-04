/**
 * Kanał pozyskania (skąd ktoś przyszedł) — wspólne dla statystyk odwiedzin i zamówień.
 * Działa w przeglądarce i na serwerze (bez importów serwerowych).
 */

/** Skąd przyszedł klient w tej sesji karty (sessionStorage) — dołączane do zamówienia, żeby było wiadomo, co sprzedaje. */
export const TOUCH_KEY = 'akta-zrodlo';

export const CHANNELS = [
  'Meta Ads',
  'Google Ads',
  'Facebook',
  'Instagram',
  'TikTok',
  'Mail',
  'Wyszukiwarka',
  'Inne strony',
  'Bezpośrednio',
  'Nieznane',
] as const;
export type Channel = (typeof CHANNELS)[number];

/** Kody rabatowe używane tylko w reklamach — zamówienie z takim kodem bez innych danych liczymy jako „Meta Ads”. */
export const AD_ONLY_CODES = ['DRUGA50'];

export interface Touch {
  /** utm_source */
  s?: string | null;
  /** utm_medium */
  m?: string | null;
  /** utm_campaign */
  c?: string | null;
  /** utm_content (np. nazwa reklamy) */
  ct?: string | null;
  /** host strony, z której przyszedł */
  ref?: string | null;
  /** identyfikator kliknięcia: fb (fbclid) / g (gclid) / tt (ttclid) */
  cid?: string | null;
  /** strona wejścia */
  lp?: string | null;
}

const MAIL_HOSTS = /(^|\.)(mail\.google\.com|poczta\.(onet|wp|interia|o2)\.pl|outlook\.(live|office)\.com|mail\.yahoo\.com|poczta\.gazeta\.pl|mail\.proton\.me|1poczta\.wp\.pl)$/;

export function channelOf(t: Touch | null | undefined): Channel {
  if (!t) return 'Nieznane';
  if (!hasSource(t)) return 'Bezpośrednio'; // m.in. powrót z bramki płatności
  const s = (t.s ?? '').toLowerCase();
  const m = (t.m ?? '').toLowerCase();
  const c = (t.c ?? '').toLowerCase();
  const ref = (t.ref ?? '').toLowerCase();
  const paid = /^(paid|cpc|ppc|cpm|ads?|paid[_-]?social|display)$/.test(m);
  const metaSrc = /^(fb|ig|msg|an|facebook|instagram|meta|messenger|audience_network|threads)$/.test(s);
  if ((paid && metaSrc) || /^meta[-_]/.test(c) || (t.cid === 'fb' && paid)) return 'Meta Ads';
  if (t.cid === 'g' || (paid && /google|youtube/.test(s))) return 'Google Ads';
  if (/^(e-?mail|newsletter)$/.test(m) || /^(mail|e-?mail|newsletter)$/.test(s) || MAIL_HOSTS.test(ref)) return 'Mail';
  if (/^(fb|facebook|messenger)$/.test(s) || /(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/.test(ref)) return 'Facebook';
  if (/^(ig|instagram)$/.test(s) || /(^|\.)instagram\.com$/.test(ref)) return 'Instagram';
  if (/tiktok/.test(s) || t.cid === 'tt' || /(^|\.)tiktok\.com$/.test(ref)) return 'TikTok';
  if (/google|bing|duckduckgo|yahoo|ecosia/.test(s) || /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.com|ecosia\.org)$/.test(ref)) return 'Wyszukiwarka';
  if (s || ref) return 'Inne strony';
  return 'Bezpośrednio';
}

/** Czy wejście niesie informację o źródle (a nie jest zwykłym wejściem bezpośrednim / powrotem z płatności). */
export function hasSource(t: Touch | null | undefined): boolean {
  if (!t) return false;
  if (t.ref && /(^|\.)(stripe\.com|checkout\.stripe\.com|przelewy24\.pl|payu\.com|tpay\.com)$/.test(t.ref)) return false;
  return Boolean(t.s || t.m || t.c || t.cid || t.ref);
}

/** Wejście z adresu i referrera (używane w przeglądarce przy pierwszym wyświetleniu strony). */
export function touchFromUrl(search: string, referrer: string, ownHost: string, path: string): Touch {
  const qs = new URLSearchParams(search);
  const v = (k: string) => qs.get(k)?.trim().toLowerCase().slice(0, 80) || null;
  let ref: string | null = null;
  try {
    const h = referrer ? new URL(referrer).hostname.replace(/^www\./, '') : '';
    if (h && h !== ownHost.replace(/^www\./, '')) ref = h.slice(0, 100);
  } catch {
    ref = null;
  }
  const cid = qs.has('fbclid') ? 'fb' : qs.has('gclid') || qs.has('gbraid') || qs.has('wbraid') ? 'g' : qs.has('ttclid') ? 'tt' : null;
  return { s: v('utm_source'), m: v('utm_medium'), c: v('utm_campaign'), ct: qs.get('utm_content')?.trim().slice(0, 120) || null, ref, cid, lp: path.slice(0, 120) };
}

/** Bezpieczne odczytanie wejścia przesłanego z formularza (JSON z przeglądarki). */
export function parseTouch(raw: unknown): Touch | null {
  if (typeof raw !== 'string' || !raw || raw.length > 1500) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const str = (k: string, n = 80, keepCase = false) => (typeof o[k] === 'string' && o[k] ? (keepCase ? String(o[k]) : String(o[k]).toLowerCase()).slice(0, n) : null);
    const t: Touch = { s: str('s'), m: str('m'), c: str('c'), ct: str('ct', 120, true), ref: str('ref', 100), cid: str('cid', 4), lp: str('lp', 120) };
    return hasSource(t) ? t : null;
  } catch {
    return null;
  }
}
