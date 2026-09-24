import 'server-only';
import { isSupabaseConfigured } from './config';
import { generatedDemoImages } from './demo-cases.generated';
import { demoCases } from './seed-data';
import { createPublicClient } from './supabase/public';
import type { CaseImage, CaseRecord, Excerpt } from './types';

const CASE_COLUMNS =
  'id, slug, case_number, title, tagline, description, highlights, contents, excerpts, difficulty, play_time_minutes, page_count, suspect_count, price_grosze, currency, cover_path, is_published, sort_order, seo_title, seo_description, tags, online_enabled, online_price_grosze, city, recordings_count, created_at, updated_at';

export function normalizeCase(row: Record<string, unknown>): CaseRecord {
  const r = row as unknown as CaseRecord;
  return {
    ...r,
    highlights: Array.isArray(r.highlights) ? r.highlights : [],
    contents: Array.isArray(r.contents) ? r.contents : [],
    excerpts: Array.isArray(r.excerpts) ? (r.excerpts as Excerpt[]) : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    online_enabled: Boolean(r.online_enabled),
    online_price_grosze: r.online_price_grosze ?? null,
    city: r.city ?? null,
    recordings_count: Number(r.recordings_count ?? 0),
  };
}

export async function getPublishedCases(): Promise<CaseRecord[]> {
  if (!isSupabaseConfigured()) return demoCases.filter((c) => c.is_published);
  const { data, error } = await createPublicClient()
    .from('cases')
    .select(CASE_COLUMNS)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[cases] getPublishedCases', error.message);
    return [];
  }
  return (data ?? []).map(normalizeCase);
}

export async function getPublishedCaseBySlug(slug: string): Promise<CaseRecord | null> {
  if (!isSupabaseConfigured()) return demoCases.find((c) => c.slug === slug && c.is_published) ?? null;
  const { data, error } = await createPublicClient()
    .from('cases')
    .select(CASE_COLUMNS)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  if (error) {
    console.error('[cases] getPublishedCaseBySlug', error.message);
    return null;
  }
  return data ? normalizeCase(data) : null;
}

/** Podglądy pokazywane w trybie demo (bez Supabase) — pliki z /public/podglad. */
const demoImages: Record<string, { path: string; caption: string }[]> = {
  '00000000-0000-4000-8000-000000000001': [
    { path: '/podglad/akta-001/1-okladka-akt.jpg', caption: 'Okładka akt sprawy' },
    { path: '/podglad/akta-001/2-instrukcja.jpg', caption: 'Instrukcja dla detektywa' },
    { path: '/podglad/akta-001/3-dowod-portfel.jpg', caption: 'Dowód nr 3 — zawartość portfela ofiary' },
    { path: '/podglad/akta-001/4-notatnik.jpg', caption: 'Notatnik detektywa — kartoteka podejrzanych' },
  ],
  ...generatedDemoImages,
};

export async function getCaseImages(caseId: string): Promise<CaseImage[]> {
  if (!isSupabaseConfigured()) {
    return (demoImages[caseId] ?? []).map((img, i) => ({ id: `demo-${i}`, case_id: caseId, path: img.path, caption: img.caption, sort_order: i }));
  }
  const { data } = await createPublicClient()
    .from('case_images')
    .select('id, case_id, path, caption, sort_order')
    .eq('case_id', caseId)
    .order('sort_order', { ascending: true });
  return (data ?? []) as CaseImage[];
}

export { CASE_COLUMNS };
