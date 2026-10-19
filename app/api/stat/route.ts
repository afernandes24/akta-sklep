import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { isServiceRoleConfigured, siteConfig } from '@/lib/config';
import { classifySource, deviceFromUA, geoFromHeaders } from '@/lib/stats-shared';
import { allow } from '@/lib/rate-limit';
import { EXCLUDE_COOKIE, EXCLUDE_MAX_AGE } from '@/lib/exclude';
import { getUser } from '@/lib/auth';
import { isAdminUser } from '@/lib/online';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|uptime|curl|wget|python|axios/i;
const ok = () => new NextResponse(null, { status: 204 });

export async function POST(req: Request) {
  if (!isServiceRoleConfigured()) return ok();
  // Urządzenie właściciela (ciasteczko z panelu admina) nie jest liczone
  const cookies = (req.headers.get('cookie') ?? '').split(/;\s*/);
  if (cookies.includes(`${EXCLUDE_COOKIE}=1`)) return ok();
  // Zalogowany admin (na dowolnym urządzeniu) też nie jest liczony — i dostaje ciasteczko, żeby kolejne wejścia odpadały od razu
  if (cookies.some((c) => /^sb-[^=]*auth-token/.test(c))) {
    const user = await getUser().catch(() => null);
    if (user && (await isAdminUser(user.id))) {
      const res = ok();
      res.cookies.set(EXCLUDE_COOKIE, '1', { path: '/', maxAge: EXCLUDE_MAX_AGE, sameSite: 'lax', secure: true });
      return res;
    }
  }
  const ua = req.headers.get('user-agent') ?? '';
  if (!ua || BOT.test(ua)) return ok();
  let body: { p?: string; q?: string; r?: string };
  try {
    body = JSON.parse((await req.text()).slice(0, 2000));
  } catch {
    return ok();
  }
  const path = String(body.p ?? '').slice(0, 200);
  if (!path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api')) return ok();

  const ip = (req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? '').trim();
  const day = new Date().toISOString().slice(0, 10);
  // Dzienny anonimowy identyfikator — adresu IP nie zapisujemy, a skrót zmienia się każdego dnia.
  const visitor = createHash('sha256')
    .update(`${day}|${ip}|${ua}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`)
    .digest('hex')
    .slice(0, 16);
  if (!allow(`stat:${visitor}`, 120, 10 * 60 * 1000)) return ok();

  const qs = new URLSearchParams(String(body.q ?? ''));
  const utm = (k: string) => qs.get(k)?.trim().toLowerCase().slice(0, 60) || null;
  let refHost: string | null = null;
  try {
    const h = body.r ? new URL(body.r).hostname.replace(/^www\./, '') : '';
    if (h && h !== new URL(siteConfig.url).hostname.replace(/^www\./, '')) refHost = h.slice(0, 100);
  } catch {
    refHost = null;
  }
  const geo = geoFromHeaders(req.headers);

  const db = createAdminClient();
  const row = {
    path,
    visitor,
    source: classifySource(utm('utm_source'), refHost),
    referrer_host: refHost,
    utm_source: utm('utm_source'),
    utm_medium: utm('utm_medium'),
    utm_campaign: utm('utm_campaign'),
    device: deviceFromUA(ua),
    country: geo.country,
    region: geo.region,
    city: geo.city,
  };
  // lat/lon (punkty miast na mapie) — jeśli baza nie ma jeszcze tych kolumn, zapis idzie bez nich
  const { error } = await db.from('page_views').insert({ ...row, lat: geo.lat, lon: geo.lon });
  if (error) await db.from('page_views').insert(row);
  // Raz na jakiś czas sprzątamy dane starsze niż 13 miesięcy (tak mówi polityka prywatności)
  if (Math.random() < 0.01) await db.from('page_views').delete().lt('at', new Date(Date.now() - 400 * 864e5).toISOString());
  return ok();
}
