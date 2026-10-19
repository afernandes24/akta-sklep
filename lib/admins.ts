import 'server-only';
import { createAdminClient } from './supabase/admin';

/** Konta administratorów — ich zamówienia (zwykle testy) nie wliczają się do zamówień, ewidencji i statystyk. */
export interface AdminSet {
  ids: Set<string>;
  emails: Set<string>;
}

export async function getAdmins(): Promise<AdminSet> {
  const { data } = await createAdminClient().from('profiles').select('id, email').eq('is_admin', true);
  return {
    ids: new Set((data ?? []).map((p) => p.id as string)),
    emails: new Set((data ?? []).map((p) => String(p.email ?? '').toLowerCase()).filter(Boolean)),
  };
}

export function isAdminOrder(o: { user_id?: string | null; email?: string | null } | null | undefined, a: AdminSet): boolean {
  if (!o) return false;
  return Boolean((o.user_id && a.ids.has(o.user_id)) || (o.email && a.emails.has(o.email.toLowerCase())));
}
