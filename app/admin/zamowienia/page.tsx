import Link from 'next/link';
import { StatusBadge } from '@/components/account/StatusBadge';
import { markOrderPaid } from '../actions';
import { formatDate, formatPrice, statusLabels } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Order } from '@/lib/types';
import { requireAdmin } from '@/lib/auth';

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin(); // każda strona panelu sprawdza uprawnienia sama (layout nie zawsze się wykonuje)
  const sp = await searchParams;
  const db = createAdminClient();
  let query = db
    .from('orders')
    .select('id, order_number, email, status, total_grosze, provider, provider_ref, created_at, paid_at, order_items(id, title, price_grosze)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (sp.status && sp.status in statusLabels) query = query.eq('status', sp.status);
  if (sp.q) query = query.ilike('email', `%${sp.q.replace(/[%_]/g, '')}%`);
  const { data } = await query;
  const orders = (data ?? []) as unknown as Order[];

  const filters = [['', 'Wszystkie'], ...Object.entries(statusLabels)];

  return (
    <div>
      <h1 className="text-3xl font-bold">Zamówienia</h1>
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1">
          {filters.map(([value, label]) => (
            <Link
              key={value}
              href={value ? `/admin/zamowienia?status=${value}` : '/admin/zamowienia'}
              className={`rounded-md px-3 py-1.5 text-xs ${(sp.status ?? '') === value ? 'bg-ink-700 text-paper-50' : 'text-paper-200 hover:bg-ink-800'}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input name="q" defaultValue={sp.q} placeholder="Szukaj po e-mailu" className="input py-2" />
          <button className="btn-secondary py-2">Szukaj</button>
        </form>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="table-admin min-w-[760px]">
          <thead>
            <tr>
              <th>Nr</th>
              <th>Klient</th>
              <th>Produkty</th>
              <th>Kwota</th>
              <th>Status</th>
              <th>Operator</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="font-mono">
                  {o.order_number}
                  <div className="text-[11px] text-muted">{formatDate(o.created_at)}</div>
                </td>
                <td>{o.email}</td>
                <td className="text-paper-200">
                  {(o.order_items ?? []).map((i) => (
                    <div key={i.id}>{i.title}</div>
                  ))}
                </td>
                <td className="whitespace-nowrap">{formatPrice(o.total_grosze)}</td>
                <td>
                  <StatusBadge status={o.status} />
                  {o.paid_at && <div className="mt-1 text-[11px] text-muted">{formatDate(o.paid_at)}</div>}
                </td>
                <td className="font-mono text-xs text-muted">
                  {o.provider}
                  {o.provider_ref && <div className="max-w-[140px] truncate" title={o.provider_ref}>{o.provider_ref}</div>}
                </td>
                <td>
                  {o.status === 'pending' && (
                    <form action={markOrderPaid}>
                      <input type="hidden" name="id" value={o.id} />
                      <button className="btn-ghost min-h-0 py-1 text-xs" title="Nadaje klientowi dostęp do plików">
                        Oznacz jako opłacone
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted">
                  Brak zamówień.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
