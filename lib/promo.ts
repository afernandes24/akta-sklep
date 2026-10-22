import 'server-only';
import { isServiceRoleConfigured } from './config';
import { createAdminClient } from './supabase/admin';
import { getAdmins, isAdminOrder } from './admins';
import type { CaseRecord } from './types';

/**
 * PROMOCJA NA STRONIE GŁÓWNEJ.
 * Baner pokazuje się sam, dopóki kod w Admin → Rabaty jest aktywny i nie wygasł.
 * Nowa promocja = zmień CODE i SLUG poniżej (i dodaj kod w panelu).
 */
export const HOME_PROMO = {
  code: 'HALLOWEEN',
  slug: 'pusty-grob',
  eyebrow: 'Promocja Halloween',
} as const;

export interface HomePromo {
  code: string;
  percentOff: number | null;
  amountOffGrosze: number | null;
  validUntil: string | null;
  case: CaseRecord;
}

export async function getHomePromo(cases: CaseRecord[]): Promise<HomePromo | null> {
  if (!isServiceRoleConfigured()) return null;
  const c = cases.find((x) => x.slug === HOME_PROMO.slug);
  if (!c) return null;
  const { data } = await createAdminClient()
    .from('discount_codes')
    .select('code, percent_off, amount_off_grosze, min_items, valid_until, is_active')
    .eq('code', HOME_PROMO.code)
    .maybeSingle();
  if (!data?.is_active || (data.min_items as number) > 1) return null;
  if (data.valid_until && new Date(data.valid_until as string) < new Date()) return null;
  return {
    code: data.code as string,
    percentOff: (data.percent_off as number | null) ?? null,
    amountOffGrosze: (data.amount_off_grosze as number | null) ?? null,
    validUntil: (data.valid_until as string | null) ?? null,
    case: c,
  };
}

/** Bestsellery: najwięcej opłaconych zamówień (bez kont adminów). Gdy brak sprzedaży — kolejność z katalogu. */
export async function getBestsellers(cases: CaseRecord[], n = 3): Promise<CaseRecord[]> {
  if (!isServiceRoleConfigured() || cases.length <= n) return cases.slice(0, n);
  const [{ data }, admins] = await Promise.all([
    createAdminClient().from('orders').select('user_id, email, order_items(case_id)').eq('status', 'paid').limit(20000),
    getAdmins(),
  ]);
  const sold = new Map<string, number>();
  for (const o of (data ?? []) as { user_id: string | null; email: string; order_items: { case_id: string | null }[] }[]) {
    if (isAdminOrder(o, admins)) continue;
    for (const it of o.order_items ?? []) if (it.case_id) sold.set(it.case_id, (sold.get(it.case_id) ?? 0) + 1);
  }
  return [...cases]
    .map((c, i) => ({ c, i, s: sold.get(c.id) ?? 0 }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map((x) => x.c);
}
