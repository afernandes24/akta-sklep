'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { parsePriceToGrosze, slugify } from '@/lib/format';
import { fulfillOrder, isUuid } from '@/lib/orders';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSolutionName } from '@/lib/files';
import { isCaseTag } from '@/lib/tags';
import type { Excerpt, ExcerptType } from '@/lib/types';

export type SaveCaseState = { error?: string; ok?: boolean };

const EXCERPT_TYPES: ExcerptType[] = ['raport', 'przesluchanie', 'notatka', 'wiadomosc', 'wycinek'];

function revalidateShop(slug?: string) {
  revalidatePath('/');
  revalidatePath('/sprawy');
  revalidatePath('/sitemap.xml');
  if (slug) revalidatePath(`/sprawy/${slug}`);
}

function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function int(value: FormDataEntryValue | null, fallback: number, min = 0, max = 100000): number {
  const n = parseInt(String(value ?? ''), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function parseExcerpts(raw: FormDataEntryValue | null): Excerpt[] {
  try {
    const parsed = JSON.parse(String(raw ?? '[]')) as Excerpt[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && EXCERPT_TYPES.includes(e.type) && String(e.body ?? '').trim())
      .slice(0, 12)
      .map((e) => ({
        type: e.type,
        title: String(e.title ?? '').slice(0, 200),
        body: String(e.body ?? '').slice(0, 4000),
        ...(e.meta ? { meta: String(e.meta).slice(0, 200) } : {}),
        ...(e.stamp ? { stamp: String(e.stamp).slice(0, 40) } : {}),
      }));
  } catch {
    return [];
  }
}

export async function saveCase(_prev: SaveCaseState, formData: FormData): Promise<SaveCaseState> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const slug = slugify(String(formData.get('slug') ?? '').trim() || title);
  const price = parsePriceToGrosze(String(formData.get('price') ?? ''));

  if (!title) return { error: 'Podaj tytuł sprawy.' };
  if (!slug) return { error: 'Adres URL (slug) jest nieprawidłowy.' };
  if (price === null) return { error: 'Podaj poprawną cenę, np. 24,99.' };

  const payload = {
    title,
    slug,
    case_number: String(formData.get('case_number') ?? '').trim() || '000',
    tagline: String(formData.get('tagline') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    highlights: lines(formData.get('highlights')),
    contents: lines(formData.get('contents')),
    excerpts: parseExcerpts(formData.get('excerpts')),
    difficulty: int(formData.get('difficulty'), 3, 1, 5),
    play_time_minutes: int(formData.get('play_time_minutes'), 90, 1, 1000),
    page_count: int(formData.get('page_count'), 0),
    suspect_count: int(formData.get('suspect_count'), 0, 0, 100),
    price_grosze: price,
    sort_order: int(formData.get('sort_order'), 0, -1000, 1000),
    is_published: formData.get('is_published') === 'on',
    seo_title: String(formData.get('seo_title') ?? '').trim() || null,
    seo_description: String(formData.get('seo_description') ?? '').trim() || null,
    tags: formData.getAll('tags').map(String).filter(isCaseTag),
    online_enabled: formData.get('online_enabled') === 'on',
    online_price_grosze: String(formData.get('online_price') ?? '').trim() ? parsePriceToGrosze(String(formData.get('online_price'))) : null,
    city: String(formData.get('city') ?? '').trim().slice(0, 60) || null,
  };

  const db = createAdminClient();
  if (id) {
    if (!isUuid(id)) return { error: 'Nieprawidłowe ID.' };
    const { data: before } = await db.from('cases').select('slug').eq('id', id).maybeSingle();
    const { error } = await db.from('cases').update(payload).eq('id', id);
    if (error) return { error: error.code === '23505' ? 'Sprawa z takim adresem URL już istnieje.' : error.message };
    revalidateShop(slug);
    if (before?.slug && before.slug !== slug) revalidatePath(`/sprawy/${before.slug}`);
    return { ok: true };
  }

  const { data, error } = await db.from('cases').insert(payload).select('id').single();
  if (error) return { error: error.code === '23505' ? 'Sprawa z takim adresem URL już istnieje.' : error.message };
  revalidateShop(slug);
  redirect(`/admin/sprawy/${data.id}?nowa=1`);
}

export async function togglePublish(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  const publish = formData.get('publish') === 'true';
  if (!isUuid(id)) return;
  const { data } = await createAdminClient().from('cases').update({ is_published: publish }).eq('id', id).select('slug').single();
  revalidateShop(data?.slug);
  revalidatePath('/admin/sprawy');
}

export async function deleteCase(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  if (!isUuid(id)) return;
  const db = createAdminClient();
  const { count } = await db.from('entitlements').select('case_id', { count: 'exact', head: true }).eq('case_id', id);
  if (count && count > 0) redirect(`/admin/sprawy/${id}?blad=sprzedana`);

  const [{ data: files }, { data: images }, { data: c }] = await Promise.all([
    db.from('case_files').select('storage_path').eq('case_id', id),
    db.from('case_images').select('path').eq('case_id', id),
    db.from('cases').select('slug, cover_path').eq('id', id).maybeSingle(),
  ]);
  if (files?.length) await db.storage.from('case-files').remove(files.map((f) => f.storage_path));
  if (images?.length) await db.storage.from('previews').remove(images.map((i) => i.path));
  if (c?.cover_path) await db.storage.from('covers').remove([c.cover_path]);
  await db.from('cases').delete().eq('id', id);
  revalidateShop(c?.slug);
  redirect('/admin/sprawy');
}

/** Rejestruje plik wgrany z przeglądarki bezpośrednio do Supabase Storage. */
export async function registerUpload(input: {
  caseId: string;
  kind: 'cover' | 'preview' | 'file';
  path: string;
  fileName: string;
  size: number;
}): Promise<{ error?: string }> {
  await requireAdmin();
  const { caseId, kind, path, fileName, size } = input;
  if (!isUuid(caseId) || !path.startsWith(`${caseId}/`) || path.includes('..')) return { error: 'Nieprawidłowa ścieżka pliku.' };

  const db = createAdminClient();
  const { data: c } = await db.from('cases').select('slug, cover_path').eq('id', caseId).maybeSingle();
  if (!c) return { error: 'Nie znaleziono sprawy.' };

  if (kind === 'cover') {
    await db.from('cases').update({ cover_path: path }).eq('id', caseId);
    if (c.cover_path && c.cover_path !== path) await db.storage.from('covers').remove([c.cover_path]);
  } else if (kind === 'preview') {
    const { count } = await db.from('case_images').select('id', { count: 'exact', head: true }).eq('case_id', caseId);
    await db.from('case_images').insert({ case_id: caseId, path, sort_order: count ?? 0 });
  } else {
    const { count } = await db.from('case_files').select('id', { count: 'exact', head: true }).eq('case_id', caseId);
    const base = fileName.replace(/\.pdf$/i, '').replace(/^\d+[_\s-]*/, '').replace(/[_-]+/g, ' ').trim();
    const label = base ? base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() : fileName;
    const { error } = await db.from('case_files').insert({
      case_id: caseId,
      label,
      file_name: fileName.slice(0, 200),
      storage_path: path,
      size_bytes: size,
      is_solution: isSolutionName(fileName),
      sort_order: count ?? 0,
    });
    if (error) return { error: error.message };
  }

  revalidateShop(c.slug);
  revalidatePath(`/admin/sprawy/${caseId}`);
  return {};
}

export async function removeCover(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('caseId'));
  if (!isUuid(id)) return;
  const db = createAdminClient();
  const { data: c } = await db.from('cases').select('slug, cover_path').eq('id', id).maybeSingle();
  if (c?.cover_path) await db.storage.from('covers').remove([c.cover_path]);
  await db.from('cases').update({ cover_path: null }).eq('id', id);
  revalidateShop(c?.slug);
  revalidatePath(`/admin/sprawy/${id}`);
}

export async function updateFile(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  const caseId = String(formData.get('caseId'));
  if (!isUuid(id)) return;
  await createAdminClient()
    .from('case_files')
    .update({
      label: String(formData.get('label') ?? '').trim().slice(0, 200) || 'Plik',
      file_name: String(formData.get('file_name') ?? '').trim().slice(0, 200) || 'plik.pdf',
      sort_order: int(formData.get('sort_order'), 0, -1000, 1000),
      is_solution: formData.get('is_solution') === 'on',
    })
    .eq('id', id);
  revalidatePath(`/admin/sprawy/${caseId}`);
}

export async function deleteFile(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  const caseId = String(formData.get('caseId'));
  if (!isUuid(id)) return;
  const db = createAdminClient();
  const { data: f } = await db.from('case_files').select('storage_path').eq('id', id).maybeSingle();
  if (f) await db.storage.from('case-files').remove([f.storage_path]);
  await db.from('case_files').delete().eq('id', id);
  revalidatePath(`/admin/sprawy/${caseId}`);
}

export async function updateImage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  const caseId = String(formData.get('caseId'));
  if (!isUuid(id)) return;
  const db = createAdminClient();
  await db
    .from('case_images')
    .update({
      caption: String(formData.get('caption') ?? '').trim().slice(0, 300) || null,
      sort_order: int(formData.get('sort_order'), 0, -1000, 1000),
    })
    .eq('id', id);
  const { data: c } = await db.from('cases').select('slug').eq('id', caseId).maybeSingle();
  revalidateShop(c?.slug);
  revalidatePath(`/admin/sprawy/${caseId}`);
}

export async function deleteImage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  const caseId = String(formData.get('caseId'));
  if (!isUuid(id)) return;
  const db = createAdminClient();
  const { data: img } = await db.from('case_images').select('path').eq('id', id).maybeSingle();
  if (img) await db.storage.from('previews').remove([img.path]);
  await db.from('case_images').delete().eq('id', id);
  const { data: c } = await db.from('cases').select('slug').eq('id', caseId).maybeSingle();
  revalidateShop(c?.slug);
  revalidatePath(`/admin/sprawy/${caseId}`);
}

/** Ręczne potwierdzenie płatności (np. po przelewie tradycyjnym). */
export async function markOrderPaid(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  if (!isUuid(id)) return;
  await fulfillOrder(id, { providerRef: 'reczne-potwierdzenie' });
  revalidatePath('/admin/zamowienia');
}

export async function markMessageRead(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  if (!isUuid(id)) return;
  await createAdminClient().from('contact_messages').update({ is_read: true }).eq('id', id);
  revalidatePath('/admin');
}
