'use client';

import { useActionState } from 'react';
import { Notice } from '@/components/ui/PageHeader';
import { type MailState, sendFollowups, sendTestMail } from './actions';

export function MailForms({ defaultCode, pending }: { defaultCode: string; pending: number }) {
  const [testState, testAction, testBusy] = useActionState<MailState, FormData>(sendTestMail, {});
  const [state, action, busy] = useActionState<MailState, FormData>(sendFollowups, {});
  return (
    <div className="space-y-6">
      <form className="card space-y-4 p-6">
        <label className="block">
          <span className="label">Kod rabatowy w mailu (tylko dla osób ze zgodą na newsletter; puste = bez kodu)</span>
          <input name="code" defaultValue={defaultCode} className="input max-w-xs font-mono uppercase" />
        </label>
        <label className="block">
          <span className="label">Wyślij osobom, które kupiły co najmniej X dni temu (żeby zdążyły zagrać)</span>
          <input name="min_days" type="number" min={0} defaultValue={2} className="input max-w-[120px]" />
        </label>
        {testState.error && <Notice tone="error">{testState.error}</Notice>}
        {testState.ok && <Notice tone="success">{testState.ok}</Notice>}
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && <Notice tone="success">{state.ok}</Notice>}
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
    </div>
  );
}
