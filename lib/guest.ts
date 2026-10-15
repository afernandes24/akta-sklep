import 'server-only';
import type { LibraryEntry } from './library';
import { isServiceRoleConfigured } from './config';
import { listRecordings } from './online';
import { isUuid } from './orders';
import { createAdminClient } from './supabase/admin';
import type { CaseFile, Order, ProductFormat } from './types';

/**
 * ZAKUP BEZ KONTA — dostęp do zamówienia przez tajny link /dostep/<token>.
 * Token jest losowy (UUID), znany tylko kupującemu (strona po płatności + e-mail z potwierdzeniem).
 * Dostęp działa tylko dla opłaconych zamówień; zwrot odbiera go automatycznie (status „refunded”).
 */

const ORDER_FIELDS =
  'id, order_number, user_id, email, status, total_grosze, currency, provider, provider_ref, created_at, paid_at, access_token, order_items(id, order_id, case_id, title, price_grosze, format)';

export async function getOrderByToken(token: string): Promise<Order | null> {
  if (!isUuid(token) || !isServiceRoleConfigured()) return null;
  const { data } = await createAdminClient().from('orders').select(ORDER_FIELDS).eq('access_token', token).maybeSingle();
  return (data as Order | null) ?? null;
}

/** Sprawy z opłaconego zamówienia — w tym samym kształcie co „Moje sprawy”. */
export async function getOrderLibrary(order: Order): Promise<LibraryEntry[]> {
  if (order.status !== 'paid') return [];
  const byCase = new Map<string, ProductFormat[]>();
  for (const item of order.order_items ?? []) {
    if (!item.case_id) continue;
    const f = (item.format === 'online' ? 'online' : 'pdf') as ProductFormat;
    byCase.set(item.case_id, Array.from(new Set([...(byCase.get(item.case_id) ?? []), f])));
  }
  const ids = Array.from(byCase.keys());
  if (!ids.length) return [];

  const db = createAdminClient();
  const [{ data: cases }, { data: files }, { data: online }, recordings] = await Promise.all([
    db.from('cases').select('id, slug, case_number, title, tagline, cover_path').in('id', ids),
    db
      .from('case_files')
      .select('id, case_id, label, file_name, storage_path, size_bytes, is_solution, sort_order')
      .in('case_id', ids)
      .order('sort_order', { ascending: true })
      .order('file_name', { ascending: true }),
    db.from('case_online').select('case_id, is_published').in('case_id', ids),
    listRecordings(ids),
  ]);

  return ids
    .map((caseId) => {
      const caseItem = cases?.find((c) => c.id === caseId);
      if (!caseItem) return null;
      const formats = byCase.get(caseId) ?? [];
      return {
        caseItem: caseItem as LibraryEntry['caseItem'],
        files: formats.includes('pdf') ? ((files ?? []) as CaseFile[]).filter((f) => f.case_id === caseId) : [],
        purchasedAt: order.paid_at ?? order.created_at,
        formats,
        onlineReady: Boolean((online ?? []).find((o) => o.case_id === caseId)?.is_published),
        recordings: recordings
          .filter((r) => r.case_id === caseId)
          .map(({ id, title, person, description, mime_type, duration_seconds }) => ({ id, title, person, description, mime_type, duration_seconds })),
      };
    })
    .filter((x): x is LibraryEntry => x !== null);
}

/** Czy opłacone zamówienie obejmuje sprawę (opcjonalnie w danej wersji). */
export function orderIncludesCase(order: Order, caseId: string, format?: ProductFormat): boolean {
  if (order.status !== 'paid') return false;
  return (order.order_items ?? []).some((i) => i.case_id === caseId && (!format || (i.format ?? 'pdf') === format));
}
