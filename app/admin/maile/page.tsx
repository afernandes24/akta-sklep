import { requireAdmin } from '@/lib/auth';
import { getCampaignSends, getSubscribers } from '@/lib/campaign';
import { formatDate } from '@/lib/format';
import { getBuyers, getFollowupSettings } from '@/lib/followup';
import { AutoForm, MailForms, WeeklyForm } from './MailForms';
import { getWeeklySettings, loadWeeklyCases, weekKey } from '@/lib/weekly';

export const dynamic = 'force-dynamic';

const preview = (typ: string, e: string) => `/admin/maile/podglad?typ=${typ}&e=${encodeURIComponent(e)}`;

export default async function AdminMailsPage() {
  await requireAdmin();
  const [{ buyers, ready }, settings, subs, { sends }, weekly, wCases] = await Promise.all([
    getBuyers(),
    getFollowupSettings(),
    getSubscribers(),
    getCampaignSends(),
    getWeeklySettings(),
    loadWeeklyCases(),
  ]);
  const week = weekKey();
  const featured = wCases.length ? wCases[(Number(week.slice(-2)) || 0) % wCases.length].title : null;
  const pending = buyers.filter((b) => b.pendingOrderIds.length);
  const sentBuyers = buyers.filter((b) => b.sentAt).sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''));
  const withConsent = pending.filter((b) => b.consentToken).length;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Maile</h1>
        <p className="mt-2 text-sm text-muted">
          Mail po zakupie: podziękowanie + prośba o opinię (link bez logowania) — ze sprawami, które dana osoba kupiła. Kod rabatowy i polecenia dostają tylko
          osoby ze zgodą na newsletter.
        </p>
      </div>
      {!ready && <p className="text-sm text-stamp-500">Najpierw uruchom w Supabase plik supabase/maile-po-zakupie.sql.</p>}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ['Kupujących', buyers.length],
          ['Czeka na maila', pending.length],
          ['Wysłano po zakupie', sentBuyers.length],
          ['Subskrybentów', subs.length],
        ].map(([l, v]) => (
          <div key={l} className="card p-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{l}</p>
            <p className="mt-1 font-serif text-3xl font-bold text-paper-50">{v}</p>
          </div>
        ))}
      </div>

      <AutoForm auto={settings.auto} code={settings.code} days={settings.days} ready={settings.ready} />
      <MailForms defaultCode={settings.code || 'DZIEKUJE30'} pending={pending.length} />

      {pending.length > 0 && (
        <section className="card p-5">
          <h2 className="font-serif text-lg font-semibold">Czeka na maila po zakupie ({pending.length}{withConsent ? `, z kodem: ${withConsent}` : ''})</h2>
          <ul className="mt-3 divide-y divide-ink-800 text-sm">
            {pending.map((b) => (
              <li key={b.email} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-paper-100">{b.email}</span>
                <span className="text-muted">
                  {b.cases.map((c) => c.title).join(', ')} · kupione {formatDate(b.lastPaidAt)} {b.consentToken ? '· 🎟 kod' : ''} ·{' '}
                  <a href={preview('zakup', b.email)} target="_blank" className="text-brass-300 hover:underline">
                    podgląd
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-serif text-lg font-semibold">Wysłane maile po zakupie ({sentBuyers.length})</h2>
        {sentBuyers.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Jeszcze nic nie wysłano.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-800 text-sm">
            {sentBuyers.map((b) => (
              <li key={b.email} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-paper-100">{b.email}</span>
                <span className="text-muted">
                  {b.cases.map((c) => c.title).join(', ')} · wysłano {formatDate(b.sentAt!)} {b.consentToken ? '· 🎟 z kodem' : '· bez kodu'} ·{' '}
                  <a href={preview('zakup', b.email)} target="_blank" className="text-brass-300 hover:underline">
                    podgląd
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <WeeklyForm
        auto={weekly.auto}
        code={weekly.code}
        dow={weekly.dow}
        hour={weekly.hour}
        ready={weekly.ready}
        subscribers={subs.length}
        sentThisWeek={sends.filter((x) => x.campaign === week).length}
        week={week}
        featured={featured}
        percent={weekly.percent}
        min={weekly.min}
      />


      {sends.length > 0 && (
        <section className="card p-5">
          <h2 className="font-serif text-lg font-semibold">Wysłane newslettery ({sends.length})</h2>
          <ul className="mt-3 divide-y divide-ink-800 text-sm">
            {sends.map((s) => (
              <li key={s.campaign + s.email} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-paper-100">{s.email}</span>
                <span className="text-muted">
                  <span className="font-mono">{s.campaign}</span> · {formatDate(s.sent_at)} ·{' '}
                  <a href={s.campaign.startsWith('TYDZIEN-') ? `${preview('tydzien', s.email)}&w=${s.campaign}` : `${preview('newsletter', s.email)}&kod=${s.campaign}`} target="_blank" className="text-brass-300 hover:underline">
                    podgląd
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
