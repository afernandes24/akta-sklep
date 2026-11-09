import { NextResponse } from 'next/server';
import { isServiceRoleConfigured, siteConfig } from '@/lib/config';
import { classifySource, deviceFromUA, geoFromHeaders } from '@/lib/stats-shared';
import { allow } from '@/lib/rate-limit';
import { EXCLUDE_COOKIE, EXCLUDE_MAX_AGE } from '@/lib/exclude';
import { getUser } from '@/lib/auth';
import { isAdminUser } from '@/lib/online';
import { createAdminClient } from '@/lib/supabase/admin';
import { maybeRunAutoFollowups } from '@/lib/followup';
import { maybeRunWeekly } from '@/lib/weekly';
import { BOT_UA, excludedCountries, visitorHash } from '@/lib/visitor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  if (!ua || BOT_UA.test(ua)) return ok();
  // Wejścia z krajów spoza sklepu (domyślnie USA) to prawie zawsze boty sprawdzające reklamy i linki
  const geo = geoFromHeaders(req.headers);
  if (geo.country && excludedCountries().has(geo.country)) return ok();
  let body: { p?: string; q?: string; r?: string; w?: number };
  try {
    body = JSON.parse((await req.text()).slice(0, 2000));
  } catch {
    return ok();
  }
  const path = String(body.p ?? '').slice(0, 200);
  if (!path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api')) return ok();
  // Przeglądarka sterowana automatycznie (navigator.webdriver) — bot
  if (body.w === 1) return ok();

  const visitor = visitorHash(req.headers);
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
  const cid = qs.has('fbclid') ? 'fb' : qs.has('gclid') || qs.has('gbraid') || qs.has('wbraid') ? 'g' : qs.has('ttclid') ? 'tt' : null;

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
  // Nowe kolumny (lat/lon, utm_content, click_id) dochodzą z plików SQL — jeśli ich jeszcze nie ma, zapis idzie bez nich
  let { error } = await db.from('page_views').insert({ ...row, lat: geo.lat, lon: geo.lon, utm_content: qs.get('utm_content')?.trim().slice(0, 120) || null, click_id: cid });
  if (error) ({ error } = await db.from('page_views').insert({ ...row, lat: geo.lat, lon: geo.lon }));
  if (error) await db.from('page_views').insert(row);
  // Przy okazji ruchu: automatyczne maile po zakupie (najwyżej raz na 30 min)
  maybeRunAutoFollowups();
  maybeRunWeekly();
  // Raz na jakiś czas sprzątamy dane starsze niż 13 miesięcy (tak mówi polityka prywatności)
  if (Math.random() < 0.01) await db.from('page_views').delete().lt('at', new Date(Date.now() - 400 * 864e5).toISOString());
  return ok();
}
