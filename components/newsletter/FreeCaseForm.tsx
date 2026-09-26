'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { type SubscribeState, subscribe } from '@/app/darmowa-sprawa/actions';
import { Notice } from '@/components/ui/PageHeader';

export function FreeCaseForm({ source = 'darmowa-sprawa', consentText, compact = false }: { source?: string; consentText: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, {});

  if (state.ok) {
    return (
      <Notice tone="success">
        <strong>Sprawdź skrzynkę.</strong> Wysłaliśmy e-mail z linkiem potwierdzającym — po kliknięciu od razu pobierzesz sprawę. Nie ma maila? Zajrzyj do
        spamu lub zakładki „Oferty”.
      </Notice>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="source" value={source} />
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Strona www
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <label className="flex gap-3 text-xs leading-relaxed text-paper-200">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0 accent-brass-400" />
        <span>
          {consentText} Administratorem danych jest sprzedawca — szczegóły w{' '}
          <Link href="/polityka-prywatnosci" target="_blank" className="text-brass-300 underline">
            polityce prywatności
          </Link>
          .
        </span>
      </label>
      <div className={`flex gap-2 ${compact ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row'}`}>
        <label className="sr-only" htmlFor={`nl-${source}`}>
          Adres e-mail
        </label>
        <input id={`nl-${source}`} name="email" type="email" required autoComplete="email" placeholder="twoj@email.pl" className="input flex-1" />
        <button className="btn-primary shrink-0" disabled={pending}>
          {pending ? 'Wysyłam…' : 'Wyślij mi sprawę'}
        </button>
      </div>
    </form>
  );
}
