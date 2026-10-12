'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { ONLINE_BUCKET, RECORDINGS_BUCKET, type OnlineDocument, type OnlineManifest } from '@/lib/online';
import { fileKind } from '@/lib/files';
import { isUuid } from '@/lib/orders';
import { createAdminClient } from '@/lib/supabase/admin';

async function revalidateCase(caseId: string) {
  const { data } = await createAdminClient().from('cases').select('slug').eq('id', caseId).maybeSingle();
  revalidatePath(`/admin/sprawy/${caseId}`);
  revalidatePath('/sprawy');
  revalidatePath('/');
  if (data?.slug) {
    revalidatePath(`/sprawy/${data.slug}`);
    revalidatePath(`/online/${data.slug}`);
  }
}

// ─── Wersja online: generowanie z PDF (renderowanie odbywa się w przeglądarce admina) ───
export interface OnlineSource {
  id: string;
  title: string;
  solution: boolean;
  hint: boolean;
  url: string;
}

export async function getOnlineSources(caseId: string): Promise<{ sources?: OnlineSource[]; version?: number; error?: string }> {
  await requireAdmin();
  if (!isUuid(caseId)) return { error: 'Nieprawidłowa sprawa.' };
  const db = createAdminClient();
  const [{ data: files }, { data: current }] = await Promise.all([
    db.from('case_files').select('id, label, file_name, storage_path, is_solution, sort_order').eq('case_id', caseId).order('sort_order').order('file_name'),
    db.from('case_online').select('version').eq('case_id', caseId).maybeSingle(),
  ]);
  if (!files?.length) return { error: 'Najpierw wgraj pliki PDF sprawy (sekcja „Pliki PDF dla kupujących”).' };
  const { data: signed } = await db.storage.from('case-files').createSignedUrls(
    files.map((f) => f.storage_path as string),
    15 * 60,
  );
  const sources = files.map((f, i) => ({
    id: f.id as string,
    title: (f.label as string) || (f.file_name as string),
    solution: fileKind(f.file_name as string, Boolean(f.is_solution)) === 'solution',
    hint: fileKind(f.file_name as string, Boolean(f.is_solution)) === 'hint',
    url: signed?.[i]?.signedUrl ?? '',
  }));
  if (sources.some((s) => !s.url)) return { error: 'Nie udało się przygotować plików PDF do odczytu.' };
  return { sources, version: ((current?.version as number | undefined) ?? 0) + 1 };
}

export async function saveOnlineManifest(caseId: string, version: number, documents: OnlineDocument[]): Promise<{ error?: string; ok?: string }> {
  await requireAdmin();
  if (!isUuid(caseId) || !Number.isInteger(version) || version < 1) return { error: 'Nieprawidłowe dane.' };
  const prefix = `${caseId}/v${version}/`;
  const clean: OnlineDocument[] = [];
  for (const [i, d] of documents.entries()) {
    const pages = (d.pages ?? []).filter((p) => typeof p.path === 'string' && p.path.startsWith(prefix) && !p.path.includes('..'));
    if (!pages.length) continue;
    clean.push({
      id: `d${i + 1}`,
      title: String(d.title ?? `Dokument ${i + 1}`).slice(0, 120),
      solution: Boolean(d.solution),
      hint: !d.solution && Boolean(d.hint),
      pages: pages.map((p) => ({ path: p.path, w: Math.round(Number(p.w) || 0), h: Math.round(Number(p.h) || 0) })),
    });
  }
  if (!clean.length) return { error: 'Brak stron do zapisania.' };
  const manifest: OnlineManifest = { format: 1, documents: clean, generated_at: new Date().toISOString() };

  const db = createAdminClient();
  const { error } = await db.from('case_online').upsert({ case_id: caseId, manifest, version }, { onConflict: 'case_id' });
  if (error) return { error: error.message };

  // Sprzątanie poprzednich wersji stron
  const { data: folders } = await db.storage.from(ONLINE_BUCKET).list(caseId, { limit: 100 });
  for (const f of folders ?? []) {
    if (f.name === `v${version}`) continue;
    const { data: old } = await db.storage.from(ONLINE_BUCKET).list(`${caseId}/${f.name}`, { limit: 1000 });
    if (old?.length) await db.storage.from(ONLINE_BUCKET).remove(old.map((o) => `${caseId}/${f.name}/${o.name}`));
  }

  await revalidateCase(caseId);
  const pages = clean.reduce((n, d) => n + d.pages.length, 0);
  return { ok: `Gotowe: ${clean.length} dokumentów, ${pages} stron (wersja ${version}).` };
}

export async function setOnlinePublished(formData: FormData) {
  await requireAdmin();
  const caseId = String(formData.get('caseId') ?? '');
  if (!isUuid(caseId)) return;
  const publish = formData.get('publish') === 'true';
  await createAdminClient().from('case_online').update({ is_published: publish }).eq('case_id', caseId);
  await revalidateCase(caseId);
}

// ─── Nagrania z przesłuchań ─────────────────────────────────────────
export async function registerRecording(input: {
  caseId: string;
  path: string;
  title: string;
  person?: string;
  mime: string;
  size: number;
  duration?: number | null;
}): Promise<{ error?: string }> {
  await requireAdmin();
  const { caseId, path } = input;
  if (!isUuid(caseId) || !path.startsWith(`${caseId}/`) || path.includes('..')) return { error: 'Nieprawidłowa ścieżka pliku.' };
  if (!/^(audio|video)\//.test(input.mime)) return { error: 'To nie jest plik audio ani wideo.' };
  const db = createAdminClient();
  const { count } = await db.from('case_recordings').select('id', { count: 'exact', head: true }).eq('case_id', caseId);
  const { error } = await db.from('case_recordings').insert({
    case_id: caseId,
    title: input.title.trim().slice(0, 140) || 'Przesłuchanie',
    person: input.person?.trim().slice(0, 120) || null,
    storage_path: path,
    mime_type: input.mime,
    size_bytes: input.size,
    duration_seconds: input.duration ? Math.round(input.duration) : null,
    sort_order: count ?? 0,
  });
  if (error) return { error: error.message };
  await revalidateCase(caseId);
  return {};
}

export async function updateRecording(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const caseId = String(formData.get('caseId') ?? '');
  if (!isUuid(id) || !isUuid(caseId)) return;
  await createAdminClient()
    .from('case_recordings')
    .update({
      title: String(formData.get('title') ?? '').trim().slice(0, 140) || 'Przesłuchanie',
      person: String(formData.get('person') ?? '').trim().slice(0, 120) || null,
      description: String(formData.get('description') ?? '').trim().slice(0, 500) || null,
      sort_order: Number.parseInt(String(formData.get('sort_order') ?? '0'), 10) || 0,
    })
    .eq('id', id);
  await revalidateCase(caseId);
}

export async function deleteRecording(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const caseId = String(formData.get('caseId') ?? '');
  if (!isUuid(id) || !isUuid(caseId)) return;
  const db = createAdminClient();
  const { data } = await db.from('case_recordings').select('storage_path').eq('id', id).maybeSingle();
  if (data?.storage_path) await db.storage.from(RECORDINGS_BUCKET).remove([data.storage_path as string]);
  await db.from('case_recordings').delete().eq('id', id);
  await revalidateCase(caseId);
}

/** Tworzy (albo odświeża) kod QR do nagrania: <nr sprawy>-n<kolejność> → /n/<token> (bez logowania). */
export async function createRecordingQr(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!isUuid(id)) return;
  const db = createAdminClient();
  const { data: rec } = await db.from('case_recordings').select('case_id, title, public_token, sort_order, cases(case_number)').eq('id', id).maybeSingle();
  if (!rec?.public_token) return;
  const { data: all } = await db.from('case_recordings').select('id').eq('case_id', rec.case_id).order('sort_order').order('created_at');
  const n = (all ?? []).findIndex((r) => r.id === id) + 1;
  const num = ((Array.isArray(rec.cases) ? rec.cases[0] : rec.cases) as { case_number?: string } | null)?.case_number ?? 'x';
  await db.from('qr_codes').upsert({ code: `${num}-n${n}`.toLowerCase(), label: `#${num} — ${rec.title}`, target: `/n/${rec.public_token}` }, { onConflict: 'code' });
  revalidatePath('/admin/qr');
  redirect('/admin/qr');
}
