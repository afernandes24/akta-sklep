/**
 * Literówki w adresach e-mail („gmial.com”, „icloud.ocm”, „wp.pll”) — podpowiedź poprawnej domeny.
 * Działa w przeglądarce i na serwerze.
 */

const DOMAINS = [
  'gmail.com', 'wp.pl', 'o2.pl', 'onet.pl', 'op.pl', 'interia.pl', 'interia.eu', 'poczta.onet.pl', 'vp.pl', 'tlen.pl',
  'gazeta.pl', 'buziaczek.pl', 'autograf.pl', 'icloud.com', 'me.com', 'outlook.com', 'outlook.pl', 'hotmail.com',
  'live.com', 'yahoo.com', 'protonmail.com', 'proton.me', 'aol.com', 'gmx.com', 'gmx.de', 'aktadetektywa.pl',
];

/** Końcówki, które prawie na pewno są literówką (nie istnieją albo nikt ich nie używa). */
const BAD_TLD: Record<string, string> = {
  ocm: 'com', con: 'com', cm: 'com', comm: 'com', cpm: 'com', xom: 'com', vom: 'com', cmo: 'com', coom: 'com', om: 'com', co: 'com',
  pll: 'pl', ppl: 'pl', lp: 'pl', p: 'pl', pk: 'pl', ol: 'pl',
};

function lev(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      // zamiana sąsiednich liter („gmial”) liczy się jako jeden błąd
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[m][n];
}

/** Poprawiony adres, jeśli domena wygląda na literówkę; null gdy adres jest w porządku (albo nie umiemy pomóc). */
export function suggestEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const user = email.slice(0, at);
  let domain = email.slice(at + 1).replace(/\.+$/, '').replace(/,/g, '.');
  if (!domain) return null;
  if (DOMAINS.includes(domain)) return null;
  // Brak kropki: „gmailcom”, „wppl”
  if (!domain.includes('.')) {
    const fix = DOMAINS.find((d) => d.replace('.', '') === domain);
    return fix ? `${user}@${fix}` : null;
  }
  const dot = domain.lastIndexOf('.');
  const tld = domain.slice(dot + 1);
  if (BAD_TLD[tld]) domain = `${domain.slice(0, dot)}.${BAD_TLD[tld]}`;
  if (DOMAINS.includes(domain)) return `${user}@${domain}`;
  // Najbliższa znana domena (1–2 literówki)
  let best: string | null = null;
  let bestD = 3;
  for (const d of DOMAINS) {
    const dist = lev(domain, d);
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  const limit = domain.length <= 6 ? 1 : 2;
  if (best && bestD <= limit) return `${user}@${best}`;
  // Sama zła końcówka przy nieznanej domenie (np. firma.ocm)
  if (BAD_TLD[tld] && tld !== 'co') return `${user}@${domain}`;
  return null;
}

/** Czy końcówka domeny to na pewno błąd (wtedy serwer nie przyjmie adresu). */
export function hasImpossibleTld(raw: string): boolean {
  const m = raw.trim().toLowerCase().match(/\.([a-z]+)$/);
  return Boolean(m && BAD_TLD[m[1]] && !['co', 'cm', 'pk', 'om', 'ol'].includes(m[1]));
}
