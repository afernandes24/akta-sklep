import Link from 'next/link';
import { StatusBadge } from '@/components/account/StatusBadge';
import { markMessageRead } from './actions';
import { formatDate, formatPrice } from '@/lib/format';
import { getSetupChecks } from '@/lib/setup-status';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';
import { seller } from '@/lib/legal/seller';

export default async function AdminDashboard() {
  await requireAdmin(); // każda strona panelu sprawdza uprawnienia sama (layout nie zawsze się wykonuje)
  const db = createAdminClient();
  const [paid, orders, users, cases, messages] = await Promise.all([
    db.from('orders').select('total_grosze, paid_at').eq('status', 'paid'),
    db.from('orders').select('id, order_number, email, status, total_grosze, created_at').order('created_at', { ascending: false }).limit(8),
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('cases').select('id, is_published'),
    db.from('contact_messages').select('*').eq('is_read', false).order('created_at', { ascending: false }).limit(10),
  ]);

  const revenue = (paid.data ?? []).reduce((s, o) => s + (o.total_grosze as number), 0);
  // Limit działalności nierejestrowanej liczony kwartalnie (polski czas)
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const quarter = (paid.data ?? [])
    .filter((o) => o.paid_at && new Date(new Date(o.paid_at as string).toLocaleString('en-US', { timeZone: 'Europe/Warsaw' })) >= qStart)
    .reduce((s, o) => s + (o.total_grosze as number), 0);
  const limit = seller.businessType === 'nierejestrowana' ? seller.quarterlyRevenueLimitGrosze : 0;
  const quarterShare = limit ? quarter / limit : 0;
  const stats = [
    ['Przychód (opłacone)', formatPrice(revenue)],
    ['Opłacone zamówienia', String(paid.data?.length ?? 0)],
    ['Użytkownicy', String(users.count ?? 0)],
    ['Sprawy (opublikowane)', `${cases.data?.length ?? 0} (${cases.data?.filter((c) => c.is_published).length ?? 0})`],
  ];

  const checks = getSetupChecks();
  const missing = checks.filter((c) => !c.ok).length;

  return (
    <div className="space-y-10">
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-xl font-semibold">Gotowość do sprzedaży</h2>
          <span className={`font-mono text-xs ${missing ? 'text-brass-300' : 'text-emerald-300'}`}>
            {missing ? `Do zrobienia: ${missing}` : 'Wszystko gotowe ✓'}
          </span>
        </div>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.label} className="flex gap-2">
              <span aria-hidden className={c.ok ? 'text-emerald-300' : 'text-stamp-500'}>
                {c.ok ? '✓' : '✗'}
              </span>
              <span>
                <span className="text-paper-50">{c.label}</span>
                {!c.ok && <span className="block text-xs text-muted">{c.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {limit > 0 && (
        <section className={`card p-6 ${quarterShare >= 0.8 ? 'border-stamp-500/60' : ''}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-xl font-semibold">Limit działalności nierejestrowanej — ten kwartał</h2>
            <span className="font-mono text-sm text-paper-100">
              {formatPrice(quarter)} / {formatPrice(limit)}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded bg-ink-800" aria-hidden>
            <div className={`h-full ${quarterShare >= 0.8 ? 'bg-stamp-500' : 'bg-brass-400'}`} style={{ width: `${Math.min(100, Math.round(quarterShare * 100))}%` }} />
          </div>
          <p className={`mt-2 text-xs ${quarterShare >= 0.8 ? 'text-stamp-500' : 'text-muted'}`}>
            {quarterShare >= 1
              ? 'Limit przekroczony — masz 7 dni na rejestrację działalności w CEIDG. Skonsultuj się z księgowym.'
              : quarterShare >= 0.8
                ? 'Zbliżasz się do limitu. Po przekroczeniu trzeba zarejestrować działalność (7 dni).'
                : `Wykorzystano ${Math.round(quarterShare * 100)}% limitu (przychód z opłaconych zamówień od początku kwartału).`}
          </p>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</p>
            <p className="mt-2 font-serif text-3xl font-bold text-paper-50">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">Ostatnie zamówienia</h2>
            <Link href="/admin/zamowienia" className="text-sm text-brass-300 hover:underline">
              Wszystkie →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-ink-800 text-sm">
            {(orders.data ?? []).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-mono text-paper-50">nr {o.order_number}</p>
                  <p className="text-xs text-muted">
                    {o.email} · {formatDate(o.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span>{formatPrice(o.total_grosze)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </li>
            ))}
            {!orders.data?.length && <li className="py-3 text-muted">Brak zamówień.</li>}
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="font-serif text-xl font-semibold">Nowe wiadomości z formularza</h2>
          <ul className="mt-4 space-y-4 text-sm">
            {(messages.data ?? []).map((m) => (
              <li key={m.id} className="rounded-lg border border-ink-700 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-paper-50">{m.subject || 'Bez tematu'}</p>
                    <p className="text-xs text-muted">
                      {m.name} ·{' '}
                      <a href={`mailto:${m.email}`} className="text-brass-300 hover:underline">
                        {m.email}
                      </a>{' '}
                      · {formatDate(m.created_at)}
                    </p>
                  </div>
                  <form action={markMessageRead}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="btn-ghost min-h-0 py-1 text-xs">Oznacz jako przeczytane</button>
                  </form>
                </div>
                <p className="mt-2 whitespace-pre-line text-paper-200">{m.message}</p>
              </li>
            ))}
            {!messages.data?.length && <li className="text-muted">Brak nowych wiadomości.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
