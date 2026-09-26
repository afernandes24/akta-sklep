'use client';

import { useActionState } from 'react';
import { Notice } from '@/components/ui/PageHeader';
import { type ContactState, sendContactMessage } from './actions';

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, {});

  if (state.ok) {
    return <Notice tone="success">Dziękujemy! Wiadomość dotarła do nas. Odpowiemy najszybciej, jak to możliwe.</Notice>;
  }

  return (
    <form action={action} className="space-y-5">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">
            Imię
          </label>
          <input id="name" name="name" required autoComplete="name" className="input" />
        </div>
        <div>
          <label htmlFor="email" className="label">
            E-mail
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="label">
          Temat <span className="text-muted">(opcjonalnie)</span>
        </label>
        <input id="subject" name="subject" className="input" placeholder="np. Faktura do zamówienia nr 12" />
      </div>
      <div>
        <label htmlFor="message" className="label">
          Wiadomość
        </label>
        <textarea id="message" name="message" required minLength={10} rows={6} className="input" />
      </div>
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Nie wypełniaj</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="text-xs text-muted">
        Twoje imię, e-mail i wiadomość wykorzystamy tylko do odpowiedzi. Szczegóły:{' '}
        <a href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-brass-300">
          polityka prywatności
        </a>
        .
      </p>
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? 'Wysyłanie…' : 'Wyślij wiadomość'}
      </button>
    </form>
  );
}
