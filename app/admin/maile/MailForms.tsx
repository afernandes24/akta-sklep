'use client';

import { useActionState } from 'react';
import { Notice } from '@/components/ui/PageHeader';
import { type MailState, saveAutoSettings, saveWeeklySettings, sendCampaignAll, sendCampaignTest, sendFollowups, sendTestMail, sendWeeklyNow, sendWeeklyTest } from './actions';

function Msg({ s }: { s: MailState }) {
  return (
    <>
      {s.error && <Notice tone="error">{s.error}</Notice>}
      {s.ok && <Notice tone="success">{s.ok}</Notice>}
    </>
  );
}

export function AutoForm({ auto, code, days, ready }: { auto: boolean; code: string; days: number; ready: boolean }) {
  const [state, action, busy] = useActionState<MailState, FormData>(saveAutoSettings, {});
  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="font-serif text-xl font-semibold">Automatycznie po każdym zakupie</h2>
      {!ready && <p className="text-sm text-stamp-500">Najpierw uruchom w Supabase plik supabase/maile-automatyczne.sql.</p>}
      <label className="flex items-center gap-3 text-sm text-paper-100">
        <input type="checkbox" name="auto" defaultChecked={auto} className="h-5 w-5 accent-brass-400" />
        Wysyłaj maila sam (sprawdza co ok. 30 minut)
      </label>
      <div className="flex flex-wrap gap-4">
        <label>
          <span className="label">Ile dni po zakupie</span>
          <input name="days" type="number" min={0} max={30} defaultValue={days} className="input w-28" />
        </label>
        <label>
          <span className="label">Kod rabatowy (dla osób ze zgodą)</span>
          <input name="code" defaultValue={code} className="input w-48 font-mono uppercase" />
        </label>
      </div>
      <p className="text-xs text-muted">Kod do automatu najlepiej bez daty ważności (Admin → Rabaty), żeby nie wygasł za kilka tygodni.</p>
      <Msg s={state} />
      <button className="btn-primary" disabled={busy}>
        {busy ? 'Zapisuję…' : 'Zapisz'}
      </button>
    </form>
  );
}

export function MailForms({ defaultCode, pending }: { defaultCode: string; pending: number }) {
  const [testState, testAction, testBusy] = useActionState<MailState, FormData>(sendTestMail, {});
  const [state, action, busy] = useActionState<MailState, FormData>(sendFollowups, {});
  return (
    <form className="card space-y-4 p-6">
      <h2 className="font-serif text-xl font-semibold">Wyślij teraz</h2>
      <label className="block">
        <span className="label">Kod rabatowy w mailu (tylko dla osób ze zgodą na newsletter; puste = bez kodu)</span>
        <input name="code" defaultValue={defaultCode} className="input max-w-xs font-mono uppercase" />
      </label>
      <label className="block">
        <span className="label">Tylko do osób, które kupiły co najmniej X dni temu (0 = wszyscy)</span>
        <input name="min_days" type="number" min={0} defaultValue={0} className="input max-w-[120px]" />
      </label>
      <Msg s={testState} />
      <Msg s={state} />
      <div className="flex flex-wrap gap-3">
        <button formAction={testAction} className="btn-secondary" disabled={testBusy || busy}>
          {testBusy ? 'Wysyłam…' : '1. Wyślij próbny do mnie'}
        </button>
        <button
          formAction={action}
          className="btn-primary"
          disabled={busy || testBusy || pending === 0}
          onClick={(e) => {
            if (!confirm(`Wysłać maila do ${pending} kupujących?`)) e.preventDefault();
          }}
        >
          {busy ? 'Wysyłam… (nie zamykaj strony)' : `2. Wyślij do kupujących (${pending})`}
        </button>
      </div>
    </form>
  );
}

export function CampaignForm({ subscribers, sent }: { subscribers: number; sent: number }) {
  const [t, tAction, tBusy] = useActionState<MailState, FormData>(sendCampaignTest, {});
  const [a, aAction, aBusy] = useActionState<MailState, FormData>(sendCampaignAll, {});
  const left = Math.max(0, subscribers - sent);
  return (
    <form className="card space-y-4 p-6">
      <h2 className="font-serif text-xl font-semibold">Kampania do newslettera: druga sprawa za 0 zł</h2>
      <p className="text-sm text-muted">
        Do osób z potwierdzonym zapisem ({subscribers}). Kod <span className="font-mono text-brass-300">DRUGAGRATIS</span>: przy 2 sprawach tańsza za 0 zł. Każdy
        dostaje tę kampanię raz — wysłano już: {sent}.
      </p>
      <label className="block">
        <span className="label">Kod kampanii</span>
        <input name="code" defaultValue="DRUGAGRATIS" className="input max-w-xs font-mono uppercase" />
      </label>
      <Msg s={t} />
      <Msg s={a} />
      <div className="flex flex-wrap gap-3">
        <button formAction={tAction} className="btn-secondary" disabled={tBusy || aBusy}>
          {tBusy ? 'Wysyłam…' : '1. Wyślij próbny do mnie'}
        </button>
        <button
          formAction={aAction}
          className="btn-primary"
          disabled={aBusy || tBusy || left === 0}
          onClick={(e) => {
            if (!confirm(`Wysłać kampanię do ${left} subskrybentów?`)) e.preventDefault();
          }}
        >
          {aBusy ? 'Wysyłam… (nie zamykaj strony)' : `2. Wyślij do subskrybentów (${left})`}
        </button>
      </div>
    </form>
  );
}

const DAYS = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'];

export function WeeklyForm({
  auto,
  code,
  dow,
  hour,
  ready,
  subscribers,
  sentThisWeek,
  week,
  featured,
}: {
  auto: boolean;
  code: string;
  dow: number;
  hour: number;
  ready: boolean;
  subscribers: number;
  sentThisWeek: number;
  week: string;
  featured: string | null;
}) {
  const [s, sAction, sBusy] = useActionState<MailState, FormData>(saveWeeklySettings, {});
  const [t, tAction, tBusy] = useActionState<MailState, FormData>(sendWeeklyTest, {});
  const [n, nAction, nBusy] = useActionState<MailState, FormData>(sendWeeklyNow, {});
  const left = Math.max(0, subscribers - sentThisWeek);
  return (
    <form className="card space-y-4 p-6">
      <h2 className="font-serif text-xl font-semibold">Newsletter co tydzień: „Sprawa tygodnia”</h2>
      <p className="text-sm text-muted">
        Co tydzień inna sprawa na pierwszym planie, porada detektywa i pozostałe sprawy. Bez kodu mail przypomina o rabacie za 3 sprawy. Świeżo zapisani (2 dni)
        dostają go od kolejnego tygodnia.
      </p>
      {!ready && <p className="text-sm text-stamp-500">Najpierw uruchom w Supabase plik supabase/newsletter-co-tydzien.sql.</p>}
      <p className="text-sm text-paper-200">
        Ten tydzień (<span className="font-mono">{week}</span>): {featured ? <strong>„{featured}”</strong> : '—'} · wysłano {sentThisWeek} z {subscribers}
      </p>
      <label className="flex items-center gap-3 text-sm text-paper-100">
        <input type="checkbox" name="auto" defaultChecked={auto} className="h-5 w-5 accent-brass-400" />
        Wysyłaj sam co tydzień
      </label>
      <div className="flex flex-wrap gap-4">
        <label>
          <span className="label">Dzień</span>
          <select name="dow" defaultValue={dow} className="input w-40">
            {DAYS.map((d, i) => (
              <option key={d} value={i + 1}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Godzina</span>
          <input name="hour" type="number" min={0} max={23} defaultValue={hour} className="input w-24" />
        </label>
        <label>
          <span className="label">Kod rabatowy (opcjonalnie)</span>
          <input name="code" defaultValue={code} placeholder="bez kodu" className="input w-48 font-mono uppercase" />
        </label>
      </div>
      <Msg s={s} />
      <Msg s={t} />
      <Msg s={n} />
      <div className="flex flex-wrap gap-3">
        <button formAction={sAction} className="btn-primary" disabled={sBusy}>
          {sBusy ? 'Zapisuję…' : 'Zapisz ustawienia'}
        </button>
        <button formAction={tAction} className="btn-secondary" disabled={tBusy}>
          {tBusy ? 'Wysyłam…' : 'Wyślij próbny do mnie'}
        </button>
        <button
          formAction={nAction}
          className="btn-secondary"
          disabled={nBusy || left === 0}
          onClick={(e) => {
            if (!confirm(`Wysłać newsletter tego tygodnia teraz do ${left} subskrybentów?`)) e.preventDefault();
          }}
        >
          {nBusy ? 'Wysyłam…' : `Wyślij teraz (${left})`}
        </button>
      </div>
    </form>
  );
}
