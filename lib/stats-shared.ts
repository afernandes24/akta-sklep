/** Zrozumiała nazwa źródła wejścia: kampania (utm_source) albo strona, z której ktoś przyszedł. */
export function classifySource(utmSource: string | null, refHost: string | null): string {
  if (utmSource) return utmSource;
  if (!refHost) return 'bezpośrednio';
  const h = refHost.toLowerCase();
  const map: [RegExp, string][] = [
    [/(^|\.)google\./, 'google'],
    [/(^|\.)bing\.com$/, 'bing'],
    [/duckduckgo\.com$/, 'duckduckgo'],
    [/instagram\.com$/, 'instagram'],
    [/(facebook\.com|fb\.com|fb\.me)$/, 'facebook'],
    [/tiktok\.com$/, 'tiktok'],
    [/(youtube\.com|youtu\.be)$/, 'youtube'],
    [/pinterest\./, 'pinterest'],
    [/(t\.co|twitter\.com|x\.com)$/, 'x / twitter'],
    [/(reddit\.com)$/, 'reddit'],
    [/(wykop\.pl)$/, 'wykop'],
    [/(stripe\.com)$/, 'powrót z płatności'],
  ];
  return map.find(([re]) => re.test(h))?.[1] ?? h;
}

export function deviceFromUA(ua: string): string {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return 'telefon';
  return 'komputer';
}

/** Kod województwa (np. „MZ”) z nagłówków Cloudflare: cf-region-code / cf-region. */
const OLD_CODES: Record<string, string> = {
  '02': 'DS', '04': 'KP', '06': 'LU', '08': 'LB', '10': 'LD', '12': 'MA', '14': 'MZ', '16': 'OP',
  '18': 'PK', '20': 'PD', '22': 'PM', '24': 'SL', '26': 'SK', '28': 'WN', '30': 'WP', '32': 'ZP',
};
const VALID = new Set(Object.values(OLD_CODES));
const BY_NAME: [RegExp, string][] = [
  [/lower silesia|dolno/i, 'DS'],
  [/kuyavi|kujaw/i, 'KP'],
  [/lublin|lubel/i, 'LU'],
  [/lubus/i, 'LB'],
  [/[lł][oó]d[zź]/i, 'LD'],
  [/lesser poland|ma[lł]opol/i, 'MA'],
  [/masovi|mazowi/i, 'MZ'],
  [/opol/i, 'OP'],
  [/subcarpath|podkarp/i, 'PK'],
  [/podlas|podlach/i, 'PD'],
  [/west pomeran|zachodniopomor/i, 'ZP'],
  [/pomeran|pomorsk/i, 'PM'],
  [/silesi|[sś]l[aą]sk/i, 'SL'],
  [/holy cross|[sś]wi[eę]tokrzysk/i, 'SK'],
  [/warmi|mazur/i, 'WN'],
  [/greater poland|wielkopol/i, 'WP'],
];
export function plRegion(country: string | null, code: string | null, name: string | null): string | null {
  if (country !== 'PL') return null;
  const c = (code ?? '').toUpperCase().replace(/^PL-/, '');
  if (VALID.has(c)) return c;
  if (OLD_CODES[c]) return OLD_CODES[c];
  const n = name ? decodeURIComponent(name) : '';
  return BY_NAME.find(([re]) => re.test(n))?.[1] ?? null;
}

/** Lokalizacja z nagłówków Cloudflare (kraj zawsze; region i miasto po włączeniu „visitor location headers”). */
/**
 * Naprawia polskie znaki z nagłówków Cloudflare: bajty UTF-8 odczytane jako Latin-1
 * dają np. „GdaÅsk” zamiast „Gdańsk”. Działa też na danych już zapisanych w bazie.
 */
export function fixText(s: string | null | undefined): string | null {
  if (!s) return null;
  let t = s;
  if (/[\u00c2-\u00c5]/.test(t) && [...t].every((c) => c.charCodeAt(0) <= 0xff)) {
    try {
      const d = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from([...t].map((c) => c.charCodeAt(0))));
      t = d;
    } catch {
      /* to nie był zepsuty UTF-8 — zostawiamy */
    }
  }
  if (/%[0-9a-f]{2}/i.test(t)) {
    try {
      t = decodeURIComponent(t);
    } catch {
      /* zostawiamy */
    }
  }
  return t.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim() || null;
}

const coord = (v: string | null, min: number, max: number) => {
  const n = v ? Number.parseFloat(v) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 1000) / 1000 : null;
};

export function geoFromHeaders(h: Headers) {
  const raw = h.get('cf-ipcountry');
  const country = raw && /^[A-Z]{2}$/.test(raw) && raw !== 'XX' && raw !== 'T1' ? raw : null;
  return {
    country,
    region: plRegion(country, h.get('cf-region-code'), fixText(h.get('cf-region'))),
    city: fixText(h.get('cf-ipcity'))?.slice(0, 80) ?? null,
    lat: coord(h.get('cf-iplatitude'), -90, 90),
    lon: coord(h.get('cf-iplongitude'), -180, 180),
  };
}
