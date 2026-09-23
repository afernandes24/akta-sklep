import { formatDate } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin';

type Row = { email: string; status: string; created_at: string; confirmed_at: string | null; source: string | null };

export default async function AdminNewsletterPage() {
  const { data, error } = await createAdminClient()
    .from('newsletter_subscribers')
    .select('email, status, created_at, confirmed_at, source')
    .order('created_at', { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Row[];
  const count = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Newsletter</h1>
          <p className="mt-2 text-sm text-muted">
            Potwierdzeni: <strong className="text-emerald-300">{count('confirmed')}</strong> · czekają na potwierdzenie: {count('pending')} · wypisani:{' '}
            {count('unsubscribed')}
          </p>
        </div>
        <a href="/admin/newsletter/eksport" className="btn-secondary py-2">
          ↓ Eksport CSV (potwierdzeni)
        </a>
      </div>
      <p className="mt-4 max-w-3xl text-xs text-muted">
        Wysyłaj newsletter wyłącznie do potwierdzonych adresów (np. importując CSV do Resend Broadcasts, MailerLite lub Brevo) i zawsze z linkiem do wypisania.
        Link wypisu dla danej osoby: <code className="font-mono">/newsletter/wypisz?token=…</code> — albo użyj mechanizmu wypisu w swoim narzędziu.
      </p>
      {error && <p className="mt-6 text-sm text-stamp-500">Błąd: {error.message} — czy uruchomiono aktualny supabase/schema.sql?</p>}
      <div className="card mt-6 overflow-x-auto">
        <table className="table-admin min-w-[640px]">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Status</th>
              <th>Zapis</th>
              <th>Potwierdzenie</th>
              <th>Źródło</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.email}>
                <td>{r.email}</td>
                <td className={r.status === 'confirmed' ? 'text-emerald-300' : 'text-muted'}>{r.status}</td>
                <td className="text-xs text-muted">{formatDate(r.created_at)}</td>
                <td className="text-xs text-muted">{r.confirmed_at ? formatDate(r.confirmed_at) : '—'}</td>
                <td className="text-xs text-muted">{r.source ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  Brak zapisów.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
