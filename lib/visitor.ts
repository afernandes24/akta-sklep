import 'server-only';
import { createHash } from 'crypto';

/** Dzienny anonimowy identyfikator odwiedzającego — adresu IP nie zapisujemy, a skrót zmienia się każdego dnia. */
export function visitorHash(h: Headers, at = new Date()): string {
  const ip = (h.get('cf-connecting-ip') ?? h.get('x-forwarded-for')?.split(',')[0] ?? '').trim();
  const ua = h.get('user-agent') ?? '';
  const day = at.toISOString().slice(0, 10);
  return createHash('sha256')
    .update(`${day}|${ip}|${ua}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Kraje, z których wejścia nie są liczone (domyślnie USA — prawie wyłącznie boty Meta/Google
 * sprawdzające reklamy i linki). Zmiana: zmienna STATS_EXCLUDE_COUNTRIES, np. „US,IE” albo pusta.
 */
export function excludedCountries(): Set<string> {
  const raw = process.env.STATS_EXCLUDE_COUNTRIES ?? 'US';
  return new Set(
    raw
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c)),
  );
}

export const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|facebookcatalog|meta-externalagent|meta-externalfetcher|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch|go-http|java\/|okhttp|phantom|puppeteer|playwright|selenium|bytespider|petalbot|ahrefs|semrush|mj12|dotbot|adsbot|google-inspectiontool|apis-google|feedfetcher|cloudflare/i;
