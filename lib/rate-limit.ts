import 'server-only';
import { headers } from 'next/headers';

/**
 * Prosty limiter w pamięci (jedna instancja na Railway). Chroni formularze przed zalewem zapytań.
 * Po restarcie serwera liczniki się zerują — to wystarcza na boty i przypadkowe spamowanie.
 */
const hits = new Map<string, number[]>();

export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get('cf-connecting-ip') ?? h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim();
}
