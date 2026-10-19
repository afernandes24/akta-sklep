import 'server-only';
import { createAdminClient } from './supabase/admin';
import { getAdmins, isAdminOrder } from './admins';
import { cityCoords } from './pl-cities';
import { fixText } from './stats-shared';

export interface CityPoint {
  name: string;
  lat: number | null;
  lon: number | null;
  value: number;
  revenue: number;
}

export interface Row {
  label: string;
  value: number;
}

export interface Stats {
  days: number;
  ready: boolean;
  views: number;
  visitors: number;
  paidOrders: number;
  revenue: number;
  conversion: number;
  daily: { date: string; visitors: number; revenue: number }[];
  sources: Row[];
  cases: { slug: string; title: string; views: number; sold: number }[];
  devices: Row[];
  countries: Row[];
  funnel: Row[];
  coupons: Row[];
  campaigns: Row[];
  map: { visitors: Record<string, number>; buyers: Record<string, number>; revenue: Record<string, number>; buyersAbroad: Row[]; buyersUnknown: number; cityVisitors: CityPoint[]; cityBuyers: CityPoint[] };
}

type View = { at: string; path: string; visitor: string; source: string; utm_campaign: string | null; device: string; country: string | null; region: string | null; city: string | null; lat?: number | null; lon?: number | null };

const top = (m: Map<string, number>, n = 10): Row[] =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));
const inc = (m: Map<string, number>, k: string, by = 1) => m.set(k, (m.get(k) ?? 0) + by);
const COUNTRY: Record<string, string> = { PL: 'Polska', DE: 'Niemcy', GB: 'Wielka Brytania', IE: 'Irlandia', NL: 'Holandia', US: 'USA', NO: 'Norwegia', UA: 'Ukraina', CZ: 'Czechy', FR: 'Francja' };

export async function getStats(days: number): Promise<Stats> {
  const db = createAdminClient();
  const since = new Date(Date.now() - days * 864e5);
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  // Kolumny lat/lon dochodzą z supabase/panel-admina.sql — bez nich zapytanie idzie bez nich
  const pvQuery = (cols: string) => db.from('page_views').select(cols).gte('at', sinceIso).order('at').limit(100000);
  const ordQuery = (cols: string) => db.from('orders').select(cols).gte('created_at', sinceIso).limit(10000);
  const PV = 'at, path, visitor, source, utm_campaign, device, country, region, city';
  const ORD = 'id, user_id, email, status, total_grosze, paid_at, created_at, discount_code, geo_country, geo_region, geo_city, order_items(case_id)';
  const [pvFull, ordFull, casesRes, admins] = await Promise.all([pvQuery(PV + ', lat, lon'), ordQuery(ORD + ', geo_lat, geo_lon'), db.from('cases').select('id, slug, title'), getAdmins()]);
  const pv = pvFull.error ? await pvQuery(PV) : pvFull;
  const orders = ordFull.error ? await ordQuery(ORD) : ordFull;
  const views = ((pv.data ?? []) as unknown as View[]).map((v) => ({ ...v, city: fixText(v.city) }));
  type Ord = { user_id: string | null; email: string; status: string; total_grosze: number; paid_at: string | null; created_at: string; discount_code: string | null; geo_country: string | null; geo_region: string | null; geo_city: string | null; geo_lat?: number | null; geo_lon?: number | null; order_items: { case_id: string | null }[] };
  // Zamówienia z kont adminów (testy) nie są liczone
  const ords = ((orders.data ?? []) as unknown as Ord[]).filter((o) => !isAdminOrder(o, admins)).map((o) => ({ ...o, geo_city: fixText(o.geo_city) }));
  const cases = (casesRes.data ?? []) as { id: string; slug: string; title: string }[];
  const paid = ords.filter((o) => o.status === 'paid');

  // Odwiedzający = unikalny dzienny identyfikator (sumowany po dniach)
  const firstByVisitor = new Map<string, View>();
  const pathsByVisitor = new Map<string, Set<string>>();
  for (const v of views) {
    if (!firstByVisitor.has(v.visitor)) firstByVisitor.set(v.visitor, v);
    if (!pathsByVisitor.has(v.visitor)) pathsByVisitor.set(v.visitor, new Set());
    pathsByVisitor.get(v.visitor)!.add(v.path);
  }
  const visitors = firstByVisitor.size;

  const dayKey = (iso: string) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
  const daily = new Map<string, { visitors: number; revenue: number }>();
  for (let i = 0; i <= days; i++) {
    const d = new Date(since.getTime() + i * 864e5);
    if (d <= new Date()) daily.set(dayKey(d.toISOString()), { visitors: 0, revenue: 0 });
  }
  for (const v of firstByVisitor.values()) daily.get(dayKey(v.at)) && (daily.get(dayKey(v.at))!.visitors += 1);
  for (const o of paid) if (o.paid_at && daily.get(dayKey(o.paid_at))) daily.get(dayKey(o.paid_at))!.revenue += o.total_grosze;

  const sources = new Map<string, number>(), devices = new Map<string, number>(), countries = new Map<string, number>(), campaigns = new Map<string, number>();
  for (const v of firstByVisitor.values()) {
    inc(sources, v.source);
    inc(devices, v.device);
    if (v.country) inc(countries, COUNTRY[v.country] ?? v.country);
    if (v.utm_campaign) inc(campaigns, v.utm_campaign);
  }

  const caseViews = new Map<string, number>();
  for (const set of pathsByVisitor.values()) for (const p of set) {
    const m = p.match(/^\/sprawy\/([^/]+)/);
    if (m) inc(caseViews, m[1]);
  }
  const sold = new Map<string, number>();
  for (const o of paid) for (const it of o.order_items ?? []) if (it.case_id) inc(sold, it.case_id);
  const caseRows = cases
    .map((c) => ({ slug: c.slug, title: c.title, views: caseViews.get(c.slug) ?? 0, sold: sold.get(c.id) ?? 0 }))
    .filter((c) => c.views || c.sold)
    .sort((a, b) => b.sold - a.sold || b.views - a.views)
    .slice(0, 12);

  const sawCase = [...pathsByVisitor.values()].filter((s) => [...s].some((p) => p.startsWith('/sprawy/'))).length;
  const sawCart = [...pathsByVisitor.values()].filter((s) => s.has('/koszyk')).length;
  const coupons = new Map<string, number>();
  for (const o of paid) if (o.discount_code) inc(coupons, o.discount_code);
  const revenue = paid.reduce((s, o) => s + o.total_grosze, 0);

  // Mapa: województwa (odwiedzający i kupujący) + kupujący spoza Polski
  const mapVisitors: Record<string, number> = {}, mapBuyers: Record<string, number> = {}, mapRevenue: Record<string, number> = {};
  for (const v of firstByVisitor.values()) if (v.region) mapVisitors[v.region] = (mapVisitors[v.region] ?? 0) + 1;
  const abroad = new Map<string, number>();
  let buyersUnknown = 0;
  for (const o of paid) {
    if (o.geo_region) {
      mapBuyers[o.geo_region] = (mapBuyers[o.geo_region] ?? 0) + 1;
      mapRevenue[o.geo_region] = (mapRevenue[o.geo_region] ?? 0) + o.total_grosze;
    } else if (o.geo_country && o.geo_country !== 'PL') inc(abroad, COUNTRY[o.geo_country] ?? o.geo_country);
    else buyersUnknown += 1;
  }

  // Miasta: punkty na mapie (współrzędne z Cloudflare, a gdy ich brak — z listy większych miast)
  const cityAgg = (rows: { city: string | null; lat?: number | null; lon?: number | null; amount?: number }[]): CityPoint[] => {
    const m = new Map<string, { value: number; revenue: number; lat: number; lon: number; n: number }>();
    for (const r of rows) {
      if (!r.city) continue;
      const e = m.get(r.city) ?? { value: 0, revenue: 0, lat: 0, lon: 0, n: 0 };
      e.value += 1;
      e.revenue += r.amount ?? 0;
      if (r.lat != null && r.lon != null) {
        e.lat += Number(r.lat);
        e.lon += Number(r.lon);
        e.n += 1;
      }
      m.set(r.city, e);
    }
    return [...m.entries()]
      .map(([name, e]) => {
        const fb = cityCoords(name);
        return { name, value: e.value, revenue: e.revenue, lat: e.n ? e.lat / e.n : (fb?.[0] ?? null), lon: e.n ? e.lon / e.n : (fb?.[1] ?? null) };
      })
      .sort((a, b) => b.value - a.value);
  };
  const cityVisitors = cityAgg([...firstByVisitor.values()].filter((v) => !v.country || v.country === 'PL'));
  const cityBuyers = cityAgg(paid.filter((o) => !o.geo_country || o.geo_country === 'PL').map((o) => ({ city: o.geo_city, lat: o.geo_lat, lon: o.geo_lon, amount: o.total_grosze })));

  return {
    days,
    ready: !pv.error,
    views: views.length,
    visitors,
    paidOrders: paid.length,
    revenue,
    conversion: visitors ? paid.length / visitors : 0,
    daily: [...daily.entries()].map(([date, d]) => ({ date, ...d })),
    sources: top(sources),
    cases: caseRows,
    devices: top(devices, 3),
    countries: top(countries, 8),
    funnel: [
      { label: 'Odwiedzili sklep', value: visitors },
      { label: 'Obejrzeli sprawę', value: sawCase },
      { label: 'Weszli do koszyka', value: sawCart },
      { label: 'Rozpoczęli płatność', value: ords.length },
      { label: 'Zapłacili', value: paid.length },
    ],
    coupons: top(coupons),
    campaigns: top(campaigns),
    map: { visitors: mapVisitors, buyers: mapBuyers, revenue: mapRevenue, buyersAbroad: top(abroad, 8), buyersUnknown, cityVisitors, cityBuyers },
  };
}

/* ── Na żywo: kto jest teraz w sklepie ─────────────────────────────── */
export interface LiveStats {
  ready: boolean;
  activeNow: number; // różne osoby w ostatnich 5 minutach
  todayVisitors: number;
  todayViews: number;
}

export async function getLive(): Promise<LiveStats> {
  const db = createAdminClient();
  const now = Date.now();
  // początek dnia w czasie polskim
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));
  const offset = new Date().getTime() - today.getTime();
  today.setHours(0, 0, 0, 0);
  const startOfDay = new Date(today.getTime() + offset);
  const { data, error } = await db
    .from('page_views')
    .select('at, visitor')
    .gte('at', startOfDay.toISOString())
    .order('at', { ascending: false })
    .limit(5000);
  if (error) return { ready: false, activeNow: 0, todayVisitors: 0, todayViews: 0 };
  const rows = (data ?? []) as { at: string; visitor: string }[];
  const active = new Set(rows.filter((r) => now - new Date(r.at).getTime() < 5 * 60 * 1000).map((r) => r.visitor));
  return {
    ready: true,
    activeNow: active.size,
    todayVisitors: new Set(rows.map((r) => r.visitor)).size,
    todayViews: rows.length,
  };
}
