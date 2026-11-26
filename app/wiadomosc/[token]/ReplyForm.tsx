'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Notice } from '@/components/ui/PageHeader';
import { clientReply, type ClientReplyState } from './actions';

export function ClientReplyForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ClientReplyState, FormData>(clientReply, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">Wysłane! Odpowiedź dostaniesz mailem.</Notice>}
      <label htmlFor="reply" className="label">
        Twoja odpowiedź
      </label>
      <textarea id="reply" name="body" required rows={4} maxLength={5000} className="input min-h-28" placeholder="Napisz wiadomość…" />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Wysyłam…' : 'Wyślij'}
      </button>
    </form>
  );
}
