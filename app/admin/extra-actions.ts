'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { parsePriceToGrosze } from '@/lib/format';
import { isUuid } from '@/lib/orders';
import { normalizeCode } from '@/lib/pricing';
import { createAdminClient } from '@/lib/supabase/admin';

// ─── Opinie ─────────────────────────────────────────────────────────
export async function moderateReview(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!isUuid(id)) return;
  const db = createAdminClient();
  if (status === 'delete') {
    await db.from('reviews').delete().eq('id', id);
  } else if (['approved', 'rejected', 'pending'].includes(status)) {
    await db.from('reviews').update({ status }).eq('id', id);
  }
  const { data: r } = await db.from('reviews').select('cases(slug)').eq('id', id).maybeSingle();
  const slug = (r as { cases?: { slug?: string } | null } | null)?.cases?.slug;
  revalidatePath('/admin/opinie');
  revalidatePath('/sprawy');
  if (slug) revalidatePath(`/sprawy/${slug}`);
  else revalidatePath('/sprawy/[slug]', 'page');
}

// ─── Kody rabatowe ──────────────────────────────────────────────────
export type CodeState = { error?: string; ok?: string };

export async function createDiscountCode(_prev: CodeState, formData: FormData): Promise<CodeState> {
  await requireAdmin();
  const code = normalizeCode(String(formData.get('code') ?? ''));
  const type = String(formData.get('type') ?? 'percent');
  const value = String(formData.get('value') ?? '').trim();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return { error: 'Kod: 3–32 znaki, tylko litery A–Z, cyfry, - i _.' };

  let percent_off: number | null = null;
  let amount_off_grosze: number | null = null;
  if (type === 'percent') {
    const n = parseInt(value, 10);
    if (!(n >= 1 && n <= 100)) return { error: 'Rabat procentowy: od 1 do 100.' };
    percent_off = n;
  } else {
    const g = parsePriceToGrosze(value);
    if (!g) return { error: 'Podaj kwotę rabatu, np. 10,00.' };
    amount_off_grosze = g;
  }
  const minItems = Math.max(1, parseInt(String(formData.get('min_items') ?? '1'), 10) || 1);
  const maxUsesRaw = parseInt(String(formData.get('max_uses') ?? ''), 10);
  const until = String(formData.get('valid_until') ?? '');

  const { error } = await createAdminClient().from('discount_codes').insert({
    code,
    percent_off,
    amount_off_grosze,
    min_items: minItems,
    max_uses: maxUsesRaw > 0 ? maxUsesRaw : null,
    valid_until: until ? new Date(`${until}T23:59:59+02:00`).toISOString() : null,
    one_per_user: formData.get('one_per_user') === 'on',
    note: String(formData.get('note') ?? '').trim() || null,
  });
  if (error) return { error: error.code === '23505' ? 'Taki kod już istnieje.' : error.message };
  revalidatePath('/admin/rabaty');
  return { ok: `Dodano kod ${code}.` };
}

export async function toggleDiscountCode(formData: FormData) {
  await requireAdmin();
  const code = normalizeCode(String(formData.get('code') ?? ''));
  const active = formData.get('active') === 'true';
  await createAdminClient().from('discount_codes').update({ is_active: active }).eq('code', code);
  revalidatePath('/admin/rabaty');
}

// ─── Darmowa sprawa (newsletter) ────────────────────────────────────
export async function deleteFreeFile(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get('name') ?? '');
  if (!name || name.includes('/') || name.includes('..')) return;
  const { FREE_CASE_FOLDER } = await import('@/lib/newsletter');
  await createAdminClient().storage.from('case-files').remove([`${FREE_CASE_FOLDER}/${name}`]);
  revalidatePath('/admin/darmowa-sprawa');
}
