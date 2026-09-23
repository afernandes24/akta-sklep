import 'server-only';
import { createAdminClient } from './supabase/admin';
import type { CaseFile, CaseRecord } from './types';

export interface LibraryEntry {
  caseItem: Pick<CaseRecord, 'id' | 'slug' | 'case_number' | 'title' | 'tagline' | 'cover_path'>;
  files: CaseFile[];
  purchasedAt: string;
}

/** Sprawy kupione przez użytkownika wraz z plikami. userId MUSI pochodzić z zweryfikowanej sesji. */
export async function getUserLibrary(userId: string, onlyCaseIds?: string[]): Promise<LibraryEntry[]> {
  const db = createAdminClient();
  let query = db.from('entitlements').select('case_id, created_at').eq('user_id', userId).order('created_at', { ascending: false });
  if (onlyCaseIds?.length) query = query.in('case_id', onlyCaseIds);
  const { data: ents } = await query;
  if (!ents?.length) return [];

  const ids = ents.map((e) => e.case_id as string);
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
        files: ((files ?? []) as CaseFile[]).filter((f) => f.case_id === e.case_id),
        purchasedAt: e.created_at as string,
      };
    })
    .filter((x): x is LibraryEntry => x !== null);
}
