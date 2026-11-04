import { POWIATY } from './geo-powiaty';

// Ta sama projekcja (Mercator), z której powstały granice w lib/geo-poland.ts i lib/geo-powiaty.ts
const K = 3338.43;
const LON0 = 14.1229;
const MERC = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const MERC_TOP = MERC(54.8358);
export const project = (lat: number, lon: number) => ({ x: 8 + K * (((lon - LON0) * Math.PI) / 180), y: 8.3 + K * (MERC_TOP - MERC(lat)) });

type Ring = number[]; // x0,y0,x1,y1…
let index: { id: number; rings: Ring[]; box: [number, number, number, number] }[] | null = null;

function build() {
  index = POWIATY.map((p) => {
    const rings: Ring[] = p.d
      .split('M')
      .filter(Boolean)
      .map((part) => part.replace(/Z/g, '').split('L').flatMap((xy) => xy.split(',').map(Number)));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const r of rings)
      for (let i = 0; i < r.length; i += 2) {
        x0 = Math.min(x0, r[i]);
        x1 = Math.max(x1, r[i]);
        y0 = Math.min(y0, r[i + 1]);
        y1 = Math.max(y1, r[i + 1]);
      }
    return { id: p.id, rings, box: [x0, y0, x1, y1] as [number, number, number, number] };
  });
  return index;
}

function inside(x: number, y: number, rings: Ring[]) {
  let hit = false;
  for (const r of rings)
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
  return hit;
}

const cache = new Map<string, number | null>();

/** Powiat (id z lib/geo-powiaty.ts) dla punktu; null poza Polską. */
export function powiatAt(lat: number, lon: number): number | null {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (cache.has(key)) return cache.get(key)!;
  const { x, y } = project(lat, lon);
  const idx = index ?? build();
  let found: number | null = null;
  for (const p of idx) {
    if (x < p.box[0] || x > p.box[2] || y < p.box[1] || y > p.box[3]) continue;
    if (inside(x, y, p.rings)) {
      found = p.id;
      break;
    }
  }
  // Punkt tuż przy granicy (uproszczone kształty) — najbliższy środek powiatu w promieniu ~30 km
  if (found == null) {
    let best = 625;
    for (const p of POWIATY) {
      const d = (p.cx - x) ** 2 + (p.cy - y) ** 2;
      if (d < best) {
        best = d;
        found = p.id;
      }
    }
  }
  if (cache.size > 5000) cache.clear();
  cache.set(key, found);
  return found;
}
