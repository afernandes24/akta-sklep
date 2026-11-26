'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Notice } from '@/components/ui/PageHeader';
import { adminReply, startThread, type ReplyState } from './actions';

export function AdminReplyForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<ReplyState, FormData>(adminReply, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.warning && <Notice tone="warning">{state.warning}</Notice>}
      {state.ok && !state.warning && <Notice tone="success">Wysłane — klient dostał maila z linkiem do rozmowy.</Notice>}
      <label htmlFor="reply" className="label">
        Twoja odpowiedź
      </label>
      <textarea id="reply" name="body" required rows={5} maxLength={5000} className="input min-h-32" placeholder="Napisz odpowiedź…" />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Wysyłam…' : 'Wyślij odpowiedź'}
      </button>
    </form>
  );
}

export function StartThreadForm() {
  const [state, action, pending] = useActionState<ReplyState, FormData>(startThread, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {state.error && (
        <div className="sm:col-span-2">
          <Notice tone="error">{state.error}</Notice>
        </div>
      )}
      <div>
        <label htmlFor="nt-email" className="label">
          E-mail klienta
        </label>
        <input id="nt-email" name="email" type="email" required className="input" />
      </div>
      <div>
        <label htmlFor="nt-name" className="label">
          Imię <span className="text-muted">(opcjonalnie)</span>
        </label>
        <input id="nt-name" name="name" className="input" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="nt-subject" className="label">
          Temat
        </label>
        <input id="nt-subject" name="subject" required maxLength={200} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="nt-body" className="label">
          Wiadomość
        </label>
        <textarea id="nt-body" name="body" required rows={4} maxLength={5000} className="input" />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Wysyłam…' : 'Wyślij i otwórz rozmowę'}
        </button>
      </div>
    </form>
  );
}
