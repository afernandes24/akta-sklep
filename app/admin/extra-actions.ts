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
  let second_percent_off: number | null = null;
  if (type === 'second') {
    const n = parseInt(value, 10);
    if (!(n >= 1 && n <= 100)) return { error: 'Rabat na drugą sprawę: od 1 do 100 (%).' };
    second_percent_off = n;
  } else if (type === 'percent') {
    const n = parseInt(value, 10);
    if (!(n >= 1 && n <= 100)) return { error: 'Rabat procentowy: od 1 do 100.' };
    percent_off = n;
  } else {
    const g = parsePriceToGrosze(value);
    if (!g) return { error: 'Podaj kwotę rabatu, np. 10,00.' };
    amount_off_grosze = g;
  }
  const minItems = Math.max(second_percent_off ? 2 : 1, parseInt(String(formData.get('min_items') ?? '1'), 10) || 1);
  const maxUsesRaw = parseInt(String(formData.get('max_uses') ?? ''), 10);
  const until = String(formData.get('valid_until') ?? '');

  const { error } = await createAdminClient().from('discount_codes').insert({
    code,
    percent_off,
    amount_off_grosze,
    ...(second_percent_off ? { second_percent_off } : {}),
    min_items: minItems,
    max_uses: maxUsesRaw > 0 ? maxUsesRaw : null,
    valid_until: until ? new Date(`${until}T23:59:59+02:00`).toISOString() : null,
    one_per_user: formData.get('one_per_user') === 'on',
    note: String(formData.get('note') ?? '').trim() || null,
  });
  if (error) {
    if (error.code === '23505') return { error: 'Taki kod już istnieje.' };
    if (second_percent_off && /second_percent_off|check constraint/i.test(error.message))
      return { error: 'Najpierw uruchom w Supabase plik supabase/rabat-druga-sprawa.sql (nowy rodzaj rabatu).' };
    return { error: error.message };
  }
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

// ─── Status sklepu (tryb „Wkrótce start”) ───────────────────────────
export async function setSiteOpen(formData: FormData) {
  await requireAdmin();
  const open = formData.get('open') === 'true';
  await createAdminClient().from('site_settings').upsert({ id: 1, is_open: open }, { onConflict: 'id' });
  const { forgetSiteStatus } = await import('@/lib/maintenance');
  forgetSiteStatus();
  revalidatePath('/admin');
}

export type SiteSettingsState = { error?: string; ok?: string };

export async function saveSiteSettings(_prev: SiteSettingsState, formData: FormData): Promise<SiteSettingsState> {
  await requireAdmin();
  const headline = String(formData.get('headline') ?? '').trim().slice(0, 120);
  const message = String(formData.get('message') ?? '').trim().slice(0, 1000);
  const launchLabel = String(formData.get('launch_label') ?? '').trim().slice(0, 60) || null;
  const password = String(formData.get('password') ?? '');
  const removePassword = formData.get('remove_password') === 'on';
  if (!headline || !message) return { error: 'Uzupełnij nagłówek i opis.' };
  if (password && password.length < 6) return { error: 'Hasło musi mieć co najmniej 6 znaków.' };

  const { hashPreviewPassword, forgetSiteStatus } = await import('@/lib/maintenance');
  const update: Record<string, unknown> = { id: 1, headline, message, launch_label: launchLabel };
  if (removePassword) update.preview_hash = null;
  else if (password) update.preview_hash = await hashPreviewPassword(password);

  const { error } = await createAdminClient().from('site_settings').upsert(update, { onConflict: 'id' });
  if (error) return { error: error.message.includes('site_settings') ? 'Brak tabeli ustawień — uruchom supabase/schema.sql w Supabase.' : error.message };
  forgetSiteStatus();
  revalidatePath('/admin');
  return { ok: password ? 'Zapisano. Nowe hasło działa — stare przestało działać.' : removePassword ? 'Zapisano. Wejście na hasło wyłączone.' : 'Zapisano.' };
}

// ─── Kody QR ────────────────────────────────────────────────────────
export type QrState = { error?: string; ok?: string };

function cleanTarget(raw: string): string | null {
  const t = raw.trim();
  if (/^\/[^\s]*$/.test(t) && !t.startsWith('//')) return t.slice(0, 300);
  if (/^https:\/\/[^\s]+$/.test(t)) return t.slice(0, 300);
  return null;
}

export async function saveQrCode(_prev: QrState, formData: FormData): Promise<QrState> {
  await requireAdmin();
  const code = String(formData.get('code') ?? '').trim().toLowerCase();
  const target = cleanTarget(String(formData.get('target') ?? ''));
  const label = String(formData.get('label') ?? '').trim().slice(0, 120);
  if (!/^[a-z0-9-]{2,40}$/.test(code)) return { error: 'Kod: 2–40 znaków, tylko małe litery, cyfry i myślnik (np. 006-n1).' };
  if (!target) return { error: 'Cel: ścieżka w sklepie zaczynająca się od „/” albo pełny adres https://…' };
  const { error } = await createAdminClient().from('qr_codes').upsert({ code, target, label }, { onConflict: 'code' });
  if (error) return { error: error.message.includes('qr_codes') ? 'Brak tabeli — uruchom supabase/schema.sql w Supabase.' : error.message };
  revalidatePath('/admin/qr');
  return { ok: `Zapisano kod ${code}.` };
}

export async function deleteQrCode(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get('code') ?? '');
  await createAdminClient().from('qr_codes').delete().eq('code', code);
  revalidatePath('/admin/qr');
}
