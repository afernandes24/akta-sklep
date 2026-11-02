'use client';

import { useActionState } from 'react';
import { Notice } from '@/components/ui/PageHeader';
import { type MailState, saveAutoSettings, sendFollowups, sendTestMail } from './actions';

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
