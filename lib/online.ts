import 'server-only';
import { createAdminClient } from './supabase/admin';

/**
 * WERSJA ONLINE = te same akta, co w PDF, do czytania w przeglądarce.
 * Strony PDF są zamieniane na obrazy w panelu admina (przycisk „Wygeneruj z plików PDF”)
 * i trzymane w prywatnym buckecie `online-pages`. Klient dostaje linki ważne 2 h.
 * Opis: docs/WERSJA-ONLINE.md
 */

export interface OnlinePage {
  path: string; // ścieżka w buckecie online-pages
  w: number;
  h: number;
}

export interface OnlineDocument {
  id: string; // np. "d1"
  title: string; // etykieta pliku PDF, np. „Akta sprawy”
  solution: boolean; // koperta z rozwiązaniem — otwierana na żądanie
  pages: OnlinePage[];
}

export interface OnlineManifest {
  format: 1;
  documents: OnlineDocument[];
  generated_at: string;
}

export interface Recording {
  id: string;
  case_id: string;
  title: string;
  person: string | null;
  description: string | null;
  storage_path: string;
  mime_type: string;
  size_bytes: number | null;
  duration_seconds: number | null;
  sort_order: number;
}

export const ONLINE_BUCKET = 'online-pages';
export const RECORDINGS_BUCKET = 'recordings';
const PAGE_URL_TTL = 2 * 60 * 60;

export type OnlineAccess =
  | { ok: true; admin: boolean; preview: boolean }
  | { ok: false; reason: 'not-owned' | 'not-ready' | 'not-found' };

export interface LoadedOnline {
  caseId: string;
  slug: string;
  title: string;
  caseNumber: string;
  manifest: OnlineManifest | null;
  published: boolean;
  version: number;
}

export async function loadOnline(slug: string): Promise<LoadedOnline | null> {
  const db = createAdminClient();
  const { data: c } = await db.from('cases').select('id, slug, title, case_number').eq('slug', slug).maybeSingle();
  if (!c) return null;
  const { data: o } = await db.from('case_online').select('manifest, version, is_published').eq('case_id', c.id).maybeSingle();
  return {
    caseId: c.id as string,
    slug: c.slug as string,
    title: c.title as string,
    caseNumber: c.case_number as string,
    manifest: (o?.manifest as OnlineManifest | undefined) ?? null,
    published: Boolean(o?.is_published),
    version: (o?.version as number | undefined) ?? 0,
  };
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const { data } = await createAdminClient().from('profiles').select('is_admin').eq('id', userId).maybeSingle();
  return Boolean(data?.is_admin);
}

/** Czy użytkownik ma sprawę w danej wersji (albo w dowolnej, gdy format pominięty). */
export async function ownsCase(userId: string, caseId: string, format?: 'pdf' | 'online'): Promise<boolean> {
  let q = createAdminClient().from('entitlements').select('case_id').eq('user_id', userId).eq('case_id', caseId);
  if (format) q = q.eq('format', format);
  const { data } = await q.limit(1);
  return Boolean(data?.length);
}

export async function checkOnlineAccess(o: LoadedOnline | null, userId: string): Promise<OnlineAccess> {
  if (!o) return { ok: false, reason: 'not-found' };
  const admin = await isAdminUser(userId);
  const ready = Boolean(o.manifest?.documents.length);
  if (admin) return ready ? { ok: true, admin, preview: !o.published } : { ok: false, reason: 'not-ready' };
  if (!(await ownsCase(userId, o.caseId, 'online'))) return { ok: false, reason: 'not-owned' };
  return ready && o.published ? { ok: true, admin, preview: false } : { ok: false, reason: 'not-ready' };
}

export async function signPages(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data } = await createAdminClient().storage.from(ONLINE_BUCKET).createSignedUrls(paths, PAGE_URL_TTL);
  const out: Record<string, string> = {};
  (data ?? []).forEach((d, i) => d.signedUrl && (out[paths[i]] = d.signedUrl));
  return out;
}

export async function readReading(userId: string, caseId: string) {
  const { data } = await createAdminClient()
    .from('online_reading')
    .select('notes, solution_opened_at')
    .eq('user_id', userId)
    .eq('case_id', caseId)
    .maybeSingle();
  return { notes: (data?.notes as string) ?? '', solutionOpenedAt: (data?.solution_opened_at as string | null) ?? null };
}

export async function writeReading(userId: string, caseId: string, patch: { notes?: string; solution_opened_at?: string | null }) {
  await createAdminClient()
    .from('online_reading')
    .upsert({ user_id: userId, case_id: caseId, ...patch }, { onConflict: 'user_id,case_id' });
}

export async function listRecordings(caseIds: string[]): Promise<Recording[]> {
  if (!caseIds.length) return [];
  const { data } = await createAdminClient()
    .from('case_recordings')
    .select('*')
    .in('case_id', caseIds)
    .order('sort_order')
    .order('created_at');
  return (data ?? []) as Recording[];
}

/** Widok dla przeglądarki: dokumenty z podpisanymi linkami (rozwiązanie — tylko po otwarciu koperty). */
export interface ViewerDocument {
  id: string;
  title: string;
  solution: boolean;
  locked: boolean;
  pageCount: number;
  pages: { url: string; w: number; h: number }[];
}

export async function buildDocuments(manifest: OnlineManifest, solutionOpen: boolean): Promise<ViewerDocument[]> {
  const visible = manifest.documents.filter((d) => !d.solution || solutionOpen);
  const urls = await signPages(visible.flatMap((d) => d.pages.map((p) => p.path)));
  return manifest.documents.map((d) => {
    const locked = d.solution && !solutionOpen;
    return {
      id: d.id,
      title: d.title,
      solution: d.solution,
      locked,
      pageCount: d.pages.length,
      pages: locked ? [] : d.pages.map((p) => ({ url: urls[p.path] ?? '', w: p.w, h: p.h })),
    };
  });
}

