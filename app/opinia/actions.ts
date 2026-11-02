'use server';

import { checkReviewToken } from '@/lib/followup';
import { isUuid } from '@/lib/orders';
import { allow } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { telegram } from '@/lib/telegram';

export type GuestReviewState = { error?: string; ok?: boolean };

/** Opinia z linku w mailu — weryfikacja: podpisany link + opłacone zamówienie z tą sprawą. */
export async function submitLinkReview(_prev: GuestReviewState, formData: FormData): Promise<GuestReviewState> {
  const email = String(formData.get('e') ?? '').toLowerCase();
  const token = String(formData.get('k') ?? '');
  const caseId = String(formData.get('caseId') ?? '');
  const rating = parseInt(String(formData.get('rating') ?? ''), 10);
  const body = String(formData.get('body') ?? '').trim();
  const author = String(formData.get('author') ?? '').trim();

  if (!email || !checkReviewToken(email, token)) return { error: 'Link jest nieprawidłowy. Otwórz go jeszcze raz z maila.' };
  if (!allow(`review-link:${email}`, 10, 60 * 60 * 1000)) return { error: 'Zbyt wiele prób. Spróbuj później.' };
  if (!isUuid(caseId)) return { error: 'Nieprawidłowa sprawa.' };
  if (!(rating >= 1 && rating <= 5)) return { error: 'Wybierz ocenę od 1 do 5 gwiazdek.' };
  if (body.length < 10 || body.length > 1500) return { error: 'Opinia powinna mieć od 10 do 1500 znaków.' };
  if (author.length < 2 || author.length > 40) return { error: 'Podpis powinien mieć od 2 do 40 znaków (np. imię).' };
  if (formData.get('rules') !== 'on') return { error: 'Potwierdź, że opinia jest zgodna z zasadami.' };

  const db = createAdminClient();
  const { data: orders } = await db
    .from('orders')
    .select('id, user_id, order_items!inner(case_id)')
    .eq('status', 'paid')
    .ilike('email', email.replace(/[%_]/g, ''))
    .eq('order_items.case_id', caseId)
    .order('paid_at', { ascending: false })
    .limit(1);
  const order = orders?.[0] as { id: string; user_id: string | null } | undefined;
  if (!order) return { error: 'Opinię mogą dodać tylko osoby, które kupiły tę sprawę.' };

  const row = { case_id: caseId, rating, body, author_name: author, status: 'pending' };
  let error;
  if (order.user_id) {
    ({ error } = await db.from('reviews').upsert({ ...row, user_id: order.user_id }, { onConflict: 'case_id,user_id' }));
  } else {
    const { data: existing } = await db.from('reviews').select('id').eq('case_id', caseId).eq('order_id', order.id).maybeSingle();
    ({ error } = existing
      ? await db.from('reviews').update(row).eq('id', existing.id)
      : await db.from('reviews').insert({ ...row, order_id: order.id }));
  }
  if (error) {
    console.error('[reviews] link', error.message);
    return { error: 'Nie udało się zapisać opinii. Spróbuj ponownie.' };
  }
  const { data: c } = await db.from('cases').select('title').eq('id', caseId).maybeSingle();
  await telegram(`⭐ Nowa opinia ${rating}/5 — ${c?.title ?? 'sprawa'}`, [`„${body.slice(0, 300)}” — ${author}`, 'Zaakceptuj: Admin → Opinie']);
  return { ok: true };
}
