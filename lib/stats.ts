import 'server-only';
import { createAdminClient } from './supabase/admin';

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
  pages: Row[];
  cases: { slug: string; title: string; views: number; sold: number }[];
  devices: Row[];
  countries: Row[];
  cities: Row[];
  funnel: Row[];
  coupons: Row[];
  campaigns: Row[];
  map: { visitors: Record<string, number>; buyers: Record<string, number>; revenue: Record<string, number>; buyersAbroad: Row[]; buyersUnknown: number };
}

type View = { at: string; path: string; visitor: string; source: string; utm_campaign: string | null; device: string; country: string | null; region: string | null; city: string | null };

const top = (m: Map<string, number>, n = 10): Row[] =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));
const inc = (m: Map<string, number>, k: string, by = 1) => m.set(k, (m.get(k) ?? 0) + by);
const COUNTRY: Record<string, string> = { PL: 'Polska', DE: 'Niemcy', GB: 'Wielka Brytania', IE: 'Irlandia', NL: 'Holandia', US: 'USA', NO: 'Norwegia', UA: 'Ukraina', CZ: 'Czechy', FR: 'Francja' };

export async function getStats(days: number): Promise<Stats> {
  const db = createAdminClient();
  const since = new Date(Date.now() - days * 864e5);
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const [pv, orders, casesRes] = await Promise.all([
    db.from('page_views').select('at, path, visitor, source, utm_campaign, device, country, region, city').gte('at', sinceIso).order('at').limit(100000),
    db.from('orders').select('id, status, total_grosze, paid_at, created_at, discount_code, geo_country, geo_region, order_items(case_id)').gte('created_at', sinceIso).limit(10000),
    db.from('cases').select('id, slug, title'),
  ]);
  const views = (pv.data ?? []) as View[];
  const ords = (orders.data ?? []) as { status: string; total_grosze: number; paid_at: string | null; created_at: string; discount_code: string | null; geo_country: string | null; geo_region: string | null; order_items: { case_id: string | null }[] }[];
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

  const sources = new Map<string, number>(), devices = new Map<string, number>(), countries = new Map<string, number>(), cities = new Map<string, number>(), campaigns = new Map<string, number>();
  for (const v of firstByVisitor.values()) {
    inc(sources, v.source);
    inc(devices, v.device);
    if (v.country) inc(countries, COUNTRY[v.country] ?? v.country);
    if (v.city) inc(cities, v.city);
    if (v.utm_campaign) inc(campaigns, v.utm_campaign);
  }
  const pages = new Map<string, number>();
  for (const v of views) inc(pages, v.path);

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
    pages: top(pages),
    cases: caseRows,
    devices: top(devices, 3),
    countries: top(countries, 8),
    cities: top(cities, 8),
    funnel: [
      { label: 'Odwiedzili sklep', value: visitors },
      { label: 'Obejrzeli sprawę', value: sawCase },
      { label: 'Weszli do koszyka', value: sawCart },
      { label: 'Rozpoczęli płatność', value: ords.length },
      { label: 'Zapłacili', value: paid.length },
    ],
    coupons: top(coupons),
    campaigns: top(campaigns),
    map: { visitors: mapVisitors, buyers: mapBuyers, revenue: mapRevenue, buyersAbroad: top(abroad, 8), buyersUnknown },
  };
}
