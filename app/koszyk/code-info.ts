'use server';

import { isServiceRoleConfigured } from '@/lib/config';
import { findValidCoupon } from '@/lib/discounts';
import { allow, clientIp } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';

export type CodeInfo = { code: string; text: string; hint: string; until: string | null } | null;

/** Opis kodu z linku (reklama, mail) do paska na górze strony — tylko gdy kod jest ważny. */
export async function codeInfo(raw: string): Promise<CodeInfo> {
  if (!isServiceRoleConfigured() || !/^[A-Za-z0-9_-]{3,32}$/.test(raw)) return null;
  if (!allow(`code-info:${await clientIp()}`, 30, 10 * 60 * 1000)) return null;
  const res = await findValidCoupon(raw);
  if (!res.ok) return null;
  const c = res.coupon;
  const min = Math.max(1, c.min_items ?? 1);
  let text: string;
  let hint: string;
  if (c.second_percent_off) {
    text = c.second_percent_off >= 100 ? 'druga sprawa za 0 zł' : `druga sprawa −${c.second_percent_off}%`;
    hint = 'Dodaj 2 sprawy do koszyka — tańsza z nich stanieje sama.';
  } else if (c.percent_off) {
    text = `−${c.percent_off}% na zamówienie`;
    hint = min > 1 ? `Przy ${min} sprawach w koszyku — rabat naliczy się sam.` : 'Rabat naliczy się sam w koszyku.';
  } else if (c.amount_off_grosze) {
    text = `−${(c.amount_off_grosze / 100).toFixed(2).replace('.', ',').replace(',00', '')} zł na zamówienie`;
    hint = min > 1 ? `Przy ${min} sprawach w koszyku — rabat naliczy się sam.` : 'Rabat naliczy się sam w koszyku.';
  } else return null;
  const { data } = await createAdminClient().from('discount_codes').select('valid_until').eq('code', c.code).maybeSingle();
  const vu = (data?.valid_until as string | null) ?? null;
  const until = vu
    ? new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' }).format(new Date(new Date(vu).getTime() - 1000))
    : null;
  return { code: c.code, text, hint, until };
}
