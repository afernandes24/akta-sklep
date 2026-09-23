import { formatDate, formatPrice } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Profile } from '@/lib/types';

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const db = createAdminClient();
  let query = db.from('profiles').select('id, email, full_name, is_admin, created_at').order('created_at', { ascending: false }).limit(200);
  if (sp.q) query = query.ilike('email', `%${sp.q.replace(/[%_]/g, '')}%`);
  const [{ data }, { data: ents }, { data: paid }] = await Promise.all([
    query,
    db.from('entitlements').select('user_id'),
    db.from('orders').select('user_id, total_grosze').eq('status', 'paid'),
  ]);
  const users = (data ?? []) as Profile[];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Użytkownicy</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={sp.q} placeholder="Szukaj po e-mailu" className="input py-2" />
          <button className="btn-secondary py-2">Szukaj</button>
        </form>
      </div>
      <div className="card mt-6 overflow-x-auto">
        <table className="table-admin min-w-[640px]">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Imię</th>
              <th>Rejestracja</th>
              <th>Sprawy</th>
              <th>Wydał</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.email}
                  {u.is_admin && <span className="ml-2 rounded bg-brass-500/20 px-1.5 py-0.5 font-mono text-[10px] uppercase text-brass-300">admin</span>}
                </td>
                <td className="text-paper-200">{u.full_name || '—'}</td>
                <td className="text-xs text-muted">{formatDate(u.created_at)}</td>
                <td>{(ents ?? []).filter((e) => e.user_id === u.id).length}</td>
                <td>{formatPrice((paid ?? []).filter((o) => o.user_id === u.id).reduce((s, o) => s + (o.total_grosze as number), 0))}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  Brak użytkowników.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted">
        Aby nadać komuś uprawnienia administratora, uruchom w Supabase SQL Editor: <code className="font-mono">update profiles set is_admin = true where email = &apos;…&apos;;</code>
      </p>
    </div>
  );
}
