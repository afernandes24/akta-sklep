import 'server-only';
import { createAdminClient } from './supabase/admin';
import { getAdmins, isAdminOrder } from './admins';
import { cityCoords } from './pl-cities';
import { fixText } from './stats-shared';
import { AD_ONLY_CODES, MAIL_ONLY_CODES, channelOf, CHANNELS, type Channel } from './attribution';
import { excludedCountries } from './visitor';
import { powiatAt } from './geo-locate';

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

export interface ChannelRow {
  channel: Channel;
  visitors: number;
  carts: number;
  orders: number;
  revenue: number;
}

export interface AdRow {
  label: string;
  visitors: number;
  carts: number;
  orders: number;
  revenue: number;
}

export interface BuyerRow {
  at: string;
  email: string;
  total: number;
  channel: Channel;
  detail: string | null;
  city: string | null;
  code: string | null;
  cases: string[];
}

export interface MapData {
  visitors: Record<string, number>;
  buyers: Record<string, number>;
  revenue: Record<string, number>;
  powiatVisitors: Record<number, number>;
  powiatBuyers: Record<number, number>;
  powiatRevenue: Record<number, number>;
  buyersAbroad: Row[];
  buyersUnknown: number;
  cityVisitors: CityPoint[];
  cityBuyers: CityPoint[];
}

export interface Stats {
  days: number;
  ready: boolean;
  sourcesReady: boolean;
  views: number;
  visitors: number;
  botsFiltered: number;
  paidOrders: number;
  revenue: number;
  conversion: number;
  avgOrder: number;
  pagesPerVisitor: number;
  bounce: number;
  daily: { date: string; visitors: number; revenue: number; orders: number }[];
  channels: ChannelRow[];
  meta: { visitors: number; carts: number; orders: number; revenue: number; ads: AdRow[]; placements: Row[] };
  buyers: BuyerRow[];
  buyerChannels: Row[];
  sources: Row[];
  landing: Row[];
  hours: number[];
  buyHours: number[];
  weekdays: { visitors: number[]; orders: number[] };
  cases: { slug: string; title: string; views: number; sold: number }[];
  devices: Row[];
  countries: Row[];
  funnel: Row[];
  coupons: Row[];
  campaigns: Row[];
  map: MapData;
}

type View = {
  at: string;
  path: string;
  visitor: string;
  source: string;
  referrer_host?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign: string | null;
  utm_content?: string | null;
  click_id?: string | null;
  device: string;
  country: string | null;
  region: string | null;
  city: string | null;
  lat?: number | null;
  lon?: number | null;
};

type Ord = {
  id: string;
  user_id: string | null;
  email: string;
  status: string;
  total_grosze: number;
  paid_at: string | null;
  created_at: string;
  discount_code: string | null;
  geo_country: string | null;
  geo_region: string | null;
  geo_city: string | null;
  geo_lat?: number | null;
  geo_lon?: number | null;
  src_channel?: string | null;
  src_source?: string | null;
  src_medium?: string | null;
  src_campaign?: string | null;
  src_content?: string | null;
  visitor?: string | null;
  order_items: { case_id: string | null; title: string | null }[];
};

const top = (m: Map<string, number>, n = 10): Row[] =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));
const inc = (m: Map<string, number>, k: string, by = 1) => m.set(k, (m.get(k) ?? 0) + by);
const COUNTRY: Record<string, string> = { PL: 'Polska', DE: 'Niemcy', GB: 'Wielka Brytania', IE: 'Irlandia', NL: 'Holandia', US: 'USA', NO: 'Norwegia', UA: 'Ukraina', CZ: 'Czechy', FR: 'Francja' };
const PLACEMENT: Record<string, string> = { fb: 'Facebook', ig: 'Instagram', msg: 'Messenger', an: 'Audience Network', th: 'Threads' };
const isChannel = (c: unknown): c is Channel => typeof c === 'string' && (CHANNELS as readonly string[]).includes(c);
const maskEmail = (e: string) => {
  const [u, d] = e.split('@');
  return d ? `${u.slice(0, 2)}${'•'.repeat(Math.max(1, Math.min(5, u.length - 2)))}@${d}` : e;
};
const WAW = { timeZone: 'Europe/Warsaw' } as const;
const hourOf = (iso: string) => Number(new Date(iso).toLocaleString('en-GB', { ...WAW, hour: '2-digit', hour12: false })) % 24;
const weekdayOf = (iso: string) => (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).indexOf(new Date(iso).toLocaleString('en-US', { ...WAW, weekday: 'short' }) as 'Mon');

export async function getStats(days: number): Promise<Stats> {
  const db = createAdminClient();
  const since = new Date(Date.now() - (days - 1) * 864e5);
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  // Nowe kolumny dochodzą z plików SQL (panel-admina.sql, statystyki-zrodla.sql) — bez nich zapytania idą w uboższej wersji
  const pvQuery = (cols: string) => db.from('page_views').select(cols).gte('at', sinceIso).order('at').limit(100000);
  const ordQuery = (cols: string) => db.from('orders').select(cols).gte('created_at', sinceIso).limit(10000);
  const PV = 'at, path, visitor, source, referrer_host, utm_source, utm_medium, utm_campaign, device, country, region, city';
  const ORD = 'id, user_id, email, status, total_grosze, paid_at, created_at, discount_code, geo_country, geo_region, geo_city, order_items(case_id, title)';
  const SRC = ', src_channel, src_source, src_medium, src_campaign, src_content, visitor';
  const [pvFull, ordFull, casesRes, admins] = await Promise.all([
    pvQuery(PV + ', lat, lon, utm_content, click_id'),
    ordQuery(ORD + ', geo_lat, geo_lon' + SRC),
    db.from('cases').select('id, slug, title'),
    getAdmins(),
  ]);
  let pv = pvFull;
  if (pv.error) pv = await pvQuery(PV + ', lat, lon');
  if (pv.error) pv = await pvQuery(PV);
  let orders = ordFull;
  const sourcesReady = !ordFull.error;
  if (orders.error) orders = await ordQuery(ORD + ', geo_lat, geo_lon');
  if (orders.error) orders = await ordQuery(ORD);

  // Boty: kraje wykluczone (domyślnie USA) nie są liczone — także w danych zapisanych wcześniej
  const blocked = excludedCountries();
  const allViews = ((pv.data ?? []) as unknown as View[]).map((v) => ({ ...v, city: fixText(v.city) }));
  const views = allViews.filter((v) => !v.country || !blocked.has(v.country));
  const botsFiltered = new Set(allViews.filter((v) => v.country && blocked.has(v.country)).map((v) => v.visitor)).size;

  // Zamówienia z kont adminów (testy) nie są liczone
  const ords = ((orders.data ?? []) as unknown as Ord[]).filter((o) => !isAdminOrder(o, admins)).map((o) => ({ ...o, geo_city: fixText(o.geo_city) }));
  const cases = (casesRes.data ?? []) as { id: string; slug: string; title: string }[];
  const paid = ords.filter((o) => o.status === 'paid').sort((a, b) => (b.paid_at ?? b.created_at).localeCompare(a.paid_at ?? a.created_at));

  // Odwiedzający = unikalny dzienny identyfikator (sumowany po dniach)
  const firstByVisitor = new Map<string, View>();
  const pathsByVisitor = new Map<string, Set<string>>();
  const viewsByVisitor = new Map<string, number>();
  for (const v of views) {
    if (!firstByVisitor.has(v.visitor)) firstByVisitor.set(v.visitor, v);
    if (!pathsByVisitor.has(v.visitor)) pathsByVisitor.set(v.visitor, new Set());
    pathsByVisitor.get(v.visitor)!.add(v.path);
    inc(viewsByVisitor as Map<string, number>, v.visitor);
  }
  const visitors = firstByVisitor.size;
  const sawCart = (vis: string) => pathsByVisitor.get(vis)?.has('/koszyk') ?? false;

  // Kanał odwiedzającego: z pierwszego wejścia danego dnia (tylko ono ma referrer)
  const touchOf = (v: View) => ({ s: v.utm_source, m: v.utm_medium, c: v.utm_campaign, ct: v.utm_content, ref: v.referrer_host, cid: v.click_id });
  const channelByVisitor = new Map<string, Channel>();
  for (const [vis, v] of firstByVisitor) channelByVisitor.set(vis, channelOf(touchOf(v)));

  // Kanał zamówienia: zapisany przy zakupie → dzisiejsze wejście tej samej osoby → kod tylko z reklam → nieznany
  const orderChannel = (o: Ord): Channel => {
    let ch: Channel = isChannel(o.src_channel) ? o.src_channel : o.visitor && channelByVisitor.has(o.visitor) ? channelByVisitor.get(o.visitor)! : 'Nieznane';
    const code = o.discount_code?.toUpperCase();
    if ((ch === 'Nieznane' || ch === 'Bezpośrednio') && code && AD_ONLY_CODES.includes(code)) ch = 'Meta Ads';
    if ((ch === 'Nieznane' || ch === 'Bezpośrednio') && code && MAIL_ONLY_CODES.includes(code)) ch = 'Mail';
    // Aplikacja Gmail na Androidzie przedstawia się jak Google — to mail, nie wyszukiwarka
    if (ch === 'Wyszukiwarka' && /android\.gm|outlook/.test(o.src_source ?? '')) ch = 'Mail';
    return ch;
  };
  const orderAd = (o: Ord) => o.src_content ?? (o.visitor ? firstByVisitor.get(o.visitor)?.utm_content : null) ?? null;
  const orderPlacement = (o: Ord) => {
    const s = o.src_source ?? (o.visitor ? firstByVisitor.get(o.visitor)?.utm_source : null);
    return s ? (PLACEMENT[s] ?? s) : null;
  };

  // Dzień po dniu
  const dayKey = (iso: string) => new Date(iso).toLocaleDateString('sv-SE', WAW);
  const daily = new Map<string, { visitors: number; revenue: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 864e5 + 12 * 36e5);
    if (d.getTime() - 12 * 36e5 <= Date.now()) daily.set(dayKey(d.toISOString()), { visitors: 0, revenue: 0, orders: 0 });
  }
  for (const v of firstByVisitor.values()) {
    const d = daily.get(dayKey(v.at));
    if (d) d.visitors += 1;
  }
  for (const o of paid) {
    const d = o.paid_at ? daily.get(dayKey(o.paid_at)) : null;
    if (d) {
      d.revenue += o.total_grosze;
      d.orders += 1;
    }
  }

  // Kanały: odwiedzający, koszyk, zamówienia, przychód
  const ch = new Map<Channel, ChannelRow>();
  const row = (c: Channel) => ch.get(c) ?? ch.set(c, { channel: c, visitors: 0, carts: 0, orders: 0, revenue: 0 }).get(c)!;
  for (const [vis, c] of channelByVisitor) {
    const r = row(c);
    r.visitors += 1;
    if (sawCart(vis)) r.carts += 1;
  }
  for (const o of paid) {
    const r = row(orderChannel(o));
    r.orders += 1;
    r.revenue += o.total_grosze;
  }
  const channels = [...ch.values()].sort((a, b) => b.revenue - a.revenue || b.orders - a.orders || b.visitors - a.visitors);

  // Meta Ads: osobno każda reklama (utm_content = nazwa reklamy) i miejsce wyświetlenia (fb / ig…)
  const ads = new Map<string, AdRow>();
  const ad = (label: string) => ads.get(label) ?? ads.set(label, { label, visitors: 0, carts: 0, orders: 0, revenue: 0 }).get(label)!;
  const placements = new Map<string, number>();
  const meta = { visitors: 0, carts: 0, orders: 0, revenue: 0 };
  for (const [vis, c] of channelByVisitor) {
    if (c !== 'Meta Ads') continue;
    const v = firstByVisitor.get(vis)!;
    meta.visitors += 1;
    const r = ad(v.utm_content ?? 'bez nazwy reklamy');
    r.visitors += 1;
    if (sawCart(vis)) {
      meta.carts += 1;
      r.carts += 1;
    }
    if (v.utm_source) inc(placements, PLACEMENT[v.utm_source] ?? v.utm_source);
  }
  for (const o of paid) {
    if (orderChannel(o) !== 'Meta Ads') continue;
    meta.orders += 1;
    meta.revenue += o.total_grosze;
    const r = ad(orderAd(o) ?? (o.discount_code ? `kod ${o.discount_code}` : 'bez nazwy reklamy'));
    r.orders += 1;
    r.revenue += o.total_grosze;
  }

  // Ostatni kupujący
  const buyerChannels = new Map<string, number>();
  for (const o of paid) inc(buyerChannels, orderChannel(o));
  const buyers: BuyerRow[] = paid.slice(0, 40).map((o) => {
    const c = orderChannel(o);
    const detail =
      c === 'Meta Ads'
        ? [orderAd(o), orderPlacement(o)].filter(Boolean).join(' · ') || null
        : c === 'Mail'
          ? (o.src_campaign ?? null)
          : c === 'Inne strony' || c === 'Wyszukiwarka'
            ? (o.src_source ?? null)
            : (o.src_campaign ?? null);
    return {
      at: o.paid_at ?? o.created_at,
      email: maskEmail(o.email),
      total: o.total_grosze,
      channel: c,
      detail,
      city: o.geo_city ?? (o.geo_country && o.geo_country !== 'PL' ? (COUNTRY[o.geo_country] ?? o.geo_country) : null),
      code: o.discount_code,
      cases: (o.order_items ?? []).map((i) => i.title ?? '').filter(Boolean),
    };
  });

  // Klasyczne zestawienia
  const sources = new Map<string, number>(), devices = new Map<string, number>(), countries = new Map<string, number>(), campaigns = new Map<string, number>(), landing = new Map<string, number>();
  const hours = Array<number>(24).fill(0);
  const wdVisitors = Array<number>(7).fill(0);
  for (const v of firstByVisitor.values()) {
    inc(sources, v.source);
    inc(devices, v.device);
    if (v.country) inc(countries, COUNTRY[v.country] ?? v.country);
    if (v.utm_campaign) inc(campaigns, v.utm_campaign);
    inc(landing, v.path);
    hours[hourOf(v.at)] += 1;
    const wd = weekdayOf(v.at);
    if (wd >= 0) wdVisitors[wd] += 1;
  }
  const buyHours = Array<number>(24).fill(0);
  const wdOrders = Array<number>(7).fill(0);
  for (const o of paid) {
    const at = o.paid_at ?? o.created_at;
    buyHours[hourOf(at)] += 1;
    const wd = weekdayOf(at);
    if (wd >= 0) wdOrders[wd] += 1;
  }

  const caseViews = new Map<string, number>();
  for (const set of pathsByVisitor.values())
    for (const p of set) {
      const m = p.match(/^\/sprawy\/([^/]+)/);
      if (m) inc(caseViews, m[1]);
    }
  const sold = new Map<string, number>();
  for (const o of paid) for (const it of o.order_items ?? []) if (it.case_id) inc(sold, it.case_id);
  const caseRows = cases
    .map((c) => ({ slug: c.slug, title: c.title, views: caseViews.get(c.slug) ?? 0, sold: sold.get(c.id) ?? 0 }))
    .filter((c) => c.views || c.sold)
    .sort((a, b) => b.sold - a.sold || b.views - a.views)
    .slice(0, 15);

  const sawCase = [...pathsByVisitor.values()].filter((s) => [...s].some((p) => p.startsWith('/sprawy/'))).length;
  const sawCartN = [...pathsByVisitor.values()].filter((s) => s.has('/koszyk')).length;
  const coupons = new Map<string, number>();
  for (const o of paid) if (o.discount_code) inc(coupons, o.discount_code);
  const revenue = paid.reduce((s, o) => s + o.total_grosze, 0);
  const oneView = [...viewsByVisitor.values()].filter((n) => n === 1).length;

  // Mapa: województwa, powiaty (z punktu lokalizacji) i miasta
  const mapVisitors: Record<string, number> = {}, mapBuyers: Record<string, number> = {}, mapRevenue: Record<string, number> = {};
  const powV: Record<number, number> = {}, powB: Record<number, number> = {}, powR: Record<number, number> = {};
  const pointOf = (city: string | null, lat?: number | null, lon?: number | null): [number, number] | null =>
    lat != null && lon != null ? [Number(lat), Number(lon)] : cityCoords(city);
  for (const v of firstByVisitor.values()) {
    if (v.region) mapVisitors[v.region] = (mapVisitors[v.region] ?? 0) + 1;
    if (v.country && v.country !== 'PL') continue;
    const pt = pointOf(v.city, v.lat, v.lon);
    const pw = pt ? powiatAt(pt[0], pt[1]) : null;
    if (pw != null) powV[pw] = (powV[pw] ?? 0) + 1;
  }
  const abroad = new Map<string, number>();
  let buyersUnknown = 0;
  for (const o of paid) {
    if (o.geo_region) {
      mapBuyers[o.geo_region] = (mapBuyers[o.geo_region] ?? 0) + 1;
      mapRevenue[o.geo_region] = (mapRevenue[o.geo_region] ?? 0) + o.total_grosze;
    } else if (o.geo_country && o.geo_country !== 'PL') inc(abroad, COUNTRY[o.geo_country] ?? o.geo_country);
    else buyersUnknown += 1;
    if (o.geo_country && o.geo_country !== 'PL') continue;
    const pt = pointOf(o.geo_city, o.geo_lat, o.geo_lon);
    const pw = pt ? powiatAt(pt[0], pt[1]) : null;
    if (pw != null) {
      powB[pw] = (powB[pw] ?? 0) + 1;
      powR[pw] = (powR[pw] ?? 0) + o.total_grosze;
    }
  }

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
    sourcesReady,
    views: views.length,
    visitors,
    botsFiltered,
    paidOrders: paid.length,
    revenue,
    conversion: visitors ? paid.length / visitors : 0,
    avgOrder: paid.length ? Math.round(revenue / paid.length) : 0,
    pagesPerVisitor: visitors ? views.length / visitors : 0,
    bounce: visitors ? oneView / visitors : 0,
    daily: [...daily.entries()].map(([date, d]) => ({ date, ...d })),
    channels,
    meta: { ...meta, ads: [...ads.values()].sort((a, b) => b.revenue - a.revenue || b.orders - a.orders || b.visitors - a.visitors), placements: top(placements, 6) },
    buyers,
    buyerChannels: top(buyerChannels, 12),
    sources: top(sources, 12),
    landing: top(landing, 10),
    hours,
    buyHours,
    weekdays: { visitors: wdVisitors, orders: wdOrders },
    cases: caseRows,
    devices: top(devices, 3),
    countries: top(countries, 8),
    funnel: [
      { label: 'Odwiedzili sklep', value: visitors },
      { label: 'Obejrzeli sprawę', value: sawCase },
      { label: 'Weszli do koszyka', value: sawCartN },
      { label: 'Rozpoczęli płatność', value: ords.length },
      { label: 'Zapłacili', value: paid.length },
    ],
    coupons: top(coupons),
    campaigns: top(campaigns),
    map: {
      visitors: mapVisitors,
      buyers: mapBuyers,
      revenue: mapRevenue,
      powiatVisitors: powV,
      powiatBuyers: powB,
      powiatRevenue: powR,
      buyersAbroad: top(abroad, 8),
      buyersUnknown,
      cityVisitors,
      cityBuyers,
    },
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
  const today = new Date(new Date().toLocaleString('en-US', WAW));
  const offset = new Date().getTime() - today.getTime();
  today.setHours(0, 0, 0, 0);
  const startOfDay = new Date(today.getTime() + offset);
  const { data, error } = await db
    .from('page_views')
    .select('at, visitor, country')
    .gte('at', startOfDay.toISOString())
    .order('at', { ascending: false })
    .limit(5000);
  if (error) return { ready: false, activeNow: 0, todayVisitors: 0, todayViews: 0 };
  const blocked = excludedCountries();
  const rows = ((data ?? []) as { at: string; visitor: string; country: string | null }[]).filter((r) => !r.country || !blocked.has(r.country));
  const active = new Set(rows.filter((r) => now - new Date(r.at).getTime() < 5 * 60 * 1000).map((r) => r.visitor));
  return {
    ready: true,
    activeNow: active.size,
    todayVisitors: new Set(rows.map((r) => r.visitor)).size,
    todayViews: rows.length,
  };
}
