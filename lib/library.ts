import 'server-only';
import { listRecordings, type Recording } from './online';
import { createAdminClient } from './supabase/admin';
import type { CaseFile, CaseRecord, ProductFormat } from './types';

export interface LibraryEntry {
  caseItem: Pick<CaseRecord, 'id' | 'slug' | 'case_number' | 'title' | 'tagline' | 'cover_path'>;
  files: CaseFile[];
  purchasedAt: string;
  /** Kupione wersje tej sprawy. */
  formats: ProductFormat[];
  /** Czy wersja online jest opublikowana (dla posiadaczy wersji online). */
  onlineReady: boolean;
  /** Nagrania z przesłuchań (dla posiadaczy dowolnej wersji). */
  recordings: Pick<Recording, 'id' | 'title' | 'person' | 'description' | 'mime_type' | 'duration_seconds'>[];
}

/** Sprawy kupione przez użytkownika wraz z plikami. userId MUSI pochodzić z zweryfikowanej sesji. */
export async function getUserLibrary(userId: string, onlyCaseIds?: string[]): Promise<LibraryEntry[]> {
  const db = createAdminClient();
  let query = db.from('entitlements').select('case_id, created_at, format').eq('user_id', userId).order('created_at', { ascending: false });
  if (onlyCaseIds?.length) query = query.in('case_id', onlyCaseIds);
  const { data: rawEnts } = await query;
  if (!rawEnts?.length) return [];

  // Jedna pozycja na sprawę, z listą kupionych wersji
  const byCase = new Map<string, { case_id: string; created_at: string; formats: ProductFormat[] }>();
  for (const e of rawEnts) {
    const cur = byCase.get(e.case_id as string);
    const f = ((e.format as string) === 'online' ? 'online' : 'pdf') as ProductFormat;
    if (cur) cur.formats.push(f);
    else byCase.set(e.case_id as string, { case_id: e.case_id as string, created_at: e.created_at as string, formats: [f] });
  }
  const ents = Array.from(byCase.values());
  const ids = ents.map((e) => e.case_id);
  const onlineIds = ents.filter((e) => e.formats.includes('online')).map((e) => e.case_id);
  const [{ data: online }, recordings] = await Promise.all([
    onlineIds.length
      ? db.from('case_online').select('case_id, is_published').in('case_id', onlineIds)
      : Promise.resolve({ data: [] as { case_id: string; is_published: boolean }[] }),
    listRecordings(ids),
  ]);
  const [{ data: cases }, { data: files }] = await Promise.all([
    db.from('cases').select('id, slug, case_number, title, tagline, cover_path').in('id', ids),
    db
      .from('case_files')
      .select('id, case_id, label, file_name, storage_path, size_bytes, is_solution, sort_order')
      .in('case_id', ids)
      .order('sort_order', { ascending: true })
      .order('file_name', { ascending: true }),
  ]);

  return ents
    .map((e) => {
      const caseItem = cases?.find((c) => c.id === e.case_id);
      if (!caseItem) return null;
      return {
        caseItem: caseItem as LibraryEntry['caseItem'],
        files: e.formats.includes('pdf') ? ((files ?? []) as CaseFile[]).filter((f) => f.case_id === e.case_id) : [],
        purchasedAt: e.created_at,
        formats: e.formats,
        onlineReady: Boolean((online ?? []).find((g) => g.case_id === e.case_id)?.is_published),
        recordings: recordings
          .filter((r) => r.case_id === e.case_id)
          .map(({ id, title, person, description, mime_type, duration_seconds }) => ({ id, title, person, description, mime_type, duration_seconds })),
      };
    })
    .filter((x): x is LibraryEntry => x !== null);
}
