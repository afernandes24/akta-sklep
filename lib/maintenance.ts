/**
 * Tryb „Wkrótce start” — gdy sklep jest zamknięty, goście widzą stronę /wkrotce,
 * a do sklepu wchodzą: admin (zalogowany) i osoby znające hasło podglądu.
 *
 * Plik działa też w middleware (środowisko Edge) — tylko Web Crypto i fetch, bez modułów Node.
 * Ustawienia: tabela public.site_settings (Admin → Pulpit → Status sklepu).
 */
import { SUPABASE_URL } from './supabase/url';

export const PREVIEW_COOKIE = 'akta_podglad';
export const PREVIEW_MAX_AGE = 60 * 60 * 24 * 30; // 30 dni

export interface SiteStatus {
  isOpen: boolean;
  previewHash: string | null;
}

const OPEN: SiteStatus = { isOpen: true, previewHash: null };
const TTL_MS = 20_000; // zmiana w panelu działa najpóźniej po ~20 s
let cache: { at: number; value: SiteStatus } | null = null;

function serviceHeaders(): Record<string, string> | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return SUPABASE_URL && key ? { apikey: key, Authorization: `Bearer ${key}` } : null;
}

/** Status sklepu. Przy błędzie (np. brak tabeli) sklep jest OTWARTY — żeby nigdy się nie zablokować. */
export async function getSiteStatus(): Promise<SiteStatus> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const headers = serviceHeaders();
  if (!headers) return OPEN;
  let value = OPEN;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=is_open,preview_hash`, { headers, cache: 'no-store' });
    if (res.ok) {
      const rows = (await res.json()) as { is_open: boolean; preview_hash: string | null }[];
      if (rows[0]) value = { isOpen: Boolean(rows[0].is_open), previewHash: rows[0].preview_hash ?? null };
    }
  } catch {
    value = OPEN;
  }
  cache = { at: Date.now(), value };
  return value;
}

export function forgetSiteStatus() {
  cache = null;
}

/* ── Hasło podglądu ─────────────────────────────────────────────── */
const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

async function sha256(text: string) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Zapis hasła jako „sól:sha256(sól+hasło)”. */
export async function hashPreviewPassword(password: string): Promise<string> {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  return `${salt}:${await sha256(salt + password)}`;
}

export async function checkPreviewPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored || !password) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  return sameText(await sha256(salt + password), hash);
}

/** Wartość ciasteczka podglądu — podpisana kluczem serwera; zmiana hasła unieważnia stare ciasteczka. */
export async function previewToken(previewHash: string): Promise<string> {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'akta-detektywa';
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(`podglad:${previewHash}`)));
}

export async function hasValidPreviewCookie(cookie: string | undefined, status: SiteStatus): Promise<boolean> {
  if (!cookie || !status.previewHash) return false;
  return sameText(cookie, await previewToken(status.previewHash));
}

/* ── Admin omija blokadę ────────────────────────────────────────── */
const adminCache = new Map<string, { at: number; admin: boolean }>();

export async function isAdminId(userId: string): Promise<boolean> {
  const hit = adminCache.get(userId);
  if (hit && Date.now() - hit.at < 60_000) return hit.admin;
  const headers = serviceHeaders();
  if (!headers) return false;
  let admin = false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=is_admin`, { headers, cache: 'no-store' });
    if (res.ok) admin = Boolean(((await res.json()) as { is_admin: boolean }[])[0]?.is_admin);
  } catch {
    admin = false;
  }
  if (adminCache.size > 500) adminCache.clear();
  adminCache.set(userId, { at: Date.now(), admin });
  return admin;
}

/** Ścieżki dostępne zawsze (logowanie admina, płatności, dokumenty prawne, strona „Wkrótce”). */
const ALWAYS_OPEN = [
  '/wkrotce',
  '/admin',
  '/logowanie',
  '/nie-pamietam-hasla',
  '/konto/nowe-haslo',
  '/auth',
  '/api',
  '/newsletter',
  '/regulamin',
  '/polityka-prywatnosci',
  '/polityka-cookies',
  '/nota-prawna',
  '/zwroty-i-reklamacje',
  '/kontakt',
];

export function isAlwaysOpen(path: string) {
  return ALWAYS_OPEN.some((p) => path === p || path.startsWith(`${p}/`)) || /\.[a-z0-9]+$/i.test(path);
}
