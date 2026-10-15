import 'server-only';
import { normalizeCode, type CouponRule } from './pricing';
import { createAdminClient } from './supabase/admin';

export type CouponCheck = { ok: true; coupon: CouponRule } | { ok: false; error: string };

/** Sprawdza kod rabatowy (aktywny, ważny, limit użyć, jednorazowy na klienta). */
export async function findValidCoupon(rawCode: string, userId?: string | null, email?: string | null): Promise<CouponCheck> {
  const code = normalizeCode(rawCode);
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return { ok: false, error: 'Nieprawidłowy kod rabatowy.' };
  const db = createAdminClient();
  const { data: c, error } = await db
    .from('discount_codes')
    .select('code, percent_off, amount_off_grosze, min_items, valid_until, max_uses, used_count, one_per_user, is_active')
    .eq('code', code)
    .maybeSingle();
  if (error || !c || !c.is_active) return { ok: false, error: 'Taki kod nie istnieje albo jest nieaktywny.' };
  if (c.valid_until && new Date(c.valid_until as string) < new Date()) return { ok: false, error: 'Ten kod wygasł.' };
  if (c.max_uses) {
    // Liczymy też trwające płatności innych klientów z ostatniej godziny — żeby limit nie „przeciekał” przy równoległych zakupach.
    let pending = db
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('discount_code', code)
      .eq('status', 'pending')
      .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if (userId) pending = pending.neq('user_id', userId);
    const { count: inProgress } = await pending;
    if ((c.used_count as number) + (inProgress ?? 0) >= (c.max_uses as number)) return { ok: false, error: 'Limit użyć tego kodu został wyczerpany.' };
  }
  if (c.one_per_user && (userId || email)) {
    // Jednorazowy na klienta: sprawdzamy konto i (przy zakupie bez konta) adres e-mail
    const owners = [userId ? `user_id.eq.${userId}` : null, email ? `email.ilike.${email.replace(/[%_,()]/g, '')}` : null].filter(Boolean).join(',');
    const { count } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .or(owners)
      .eq('discount_code', code)
      .eq('status', 'paid');
    if (count) return { ok: false, error: 'Ten kod został już przez ciebie wykorzystany.' };
  }
  return {
    ok: true,
    coupon: {
      code,
      percent_off: (c.percent_off as number | null) ?? null,
      amount_off_grosze: (c.amount_off_grosze as number | null) ?? null,
      min_items: c.min_items as number,
    },
  };
}
