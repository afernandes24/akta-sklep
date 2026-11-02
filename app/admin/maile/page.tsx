import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { getBuyers } from '@/lib/followup';
import { MailForms } from './MailForms';

export const dynamic = 'force-dynamic';

export default async function AdminMailsPage() {
  await requireAdmin();
  const { buyers, ready } = await getBuyers();
  const pending = buyers.filter((b) => b.pendingOrderIds.length);
  const withConsent = pending.filter((b) => b.consentToken).length;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Maile do kupujących</h1>
        <p className="mt-2 text-sm text-muted">
          Podziękowanie + prośba o opinię (link bez logowania). Osoby ze zgodą na newsletter dostają dodatkowo kod rabatowy i polecane sprawy — bez zgody
          wysyłanie promocji mailem jest niezgodne z prawem. Każdy kupujący dostaje maila tylko raz (po kolejnym zakupie — znowu).
        </p>
      </div>
      {!ready && <p className="text-sm text-stamp-500">Najpierw uruchom w Supabase plik supabase/maile-po-zakupie.sql.</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Kupujących razem', buyers.length],
          ['Czeka na maila', pending.length],
          ['W tym z kodem rabatowym', withConsent],
        ].map(([l, v]) => (
          <div key={l} className="card p-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{l}</p>
            <p className="mt-1 font-serif text-3xl font-bold text-paper-50">{v}</p>
          </div>
        ))}
      </div>
      <MailForms defaultCode="DZIEKUJE30" pending={pending.length} />
      {pending.length > 0 && (
        <section className="card p-5">
          <h2 className="font-serif text-lg font-semibold">Kto dostanie maila</h2>
          <ul className="mt-3 divide-y divide-ink-800 text-sm">
            {pending.map((b) => (
              <li key={b.email} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="text-paper-100">{b.email}</span>
                <span className="text-muted">
                  {b.cases.map((c) => c.title).join(', ')} · {formatDate(b.lastPaidAt)} {b.consentToken ? '· 🎟 kod' : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
