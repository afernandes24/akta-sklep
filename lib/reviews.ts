import 'server-only';
import { isServiceRoleConfigured, isSupabaseConfigured } from './config';
import { createAdminClient } from './supabase/admin';
import { createPublicClient } from './supabase/public';
import type { CaseRating, Review } from './types';

const REVIEW_COLUMNS = 'id, case_id, rating, body, author_name, status, created_at';

/** Średnie oceny zatwierdzonych opinii dla wszystkich spraw. */
export async function getCaseRatings(): Promise<Record<string, CaseRating>> {
  if (!isSupabaseConfigured()) return {};
  const { data, error } = await createPublicClient().from('case_ratings').select('case_id, avg_rating, review_count');
  if (error) {
    // np. przed uruchomieniem nowej wersji schema.sql
    console.warn('[reviews] case_ratings', error.message);
    return {};
  }
  return Object.fromEntries((data ?? []).map((r) => [r.case_id as string, { avg: Number(r.avg_rating), count: Number(r.review_count) }]));
}

export async function getApprovedReviews(caseId: string, limit = 30): Promise<Review[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await createPublicClient()
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .eq('case_id', caseId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as Review[];
}

/** Opinie użytkownika (dowolny status) — do formularza w „Moich sprawach”. */
export async function getUserReviews(userId: string): Promise<Record<string, Review>> {
  if (!isServiceRoleConfigured()) return {};
  const { data } = await createAdminClient().from('reviews').select(REVIEW_COLUMNS).eq('user_id', userId);
  return Object.fromEntries(((data ?? []) as Review[]).map((r) => [r.case_id, r]));
}
