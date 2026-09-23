'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { type ReviewState, submitReview } from '@/app/konto/sprawy/actions';
import { Notice } from '@/components/ui/PageHeader';
import type { Review } from '@/lib/types';

const STATUS: Record<Review['status'], string> = {
  pending: 'czeka na publikację',
  approved: 'opublikowana',
  rejected: 'odrzucona — niezgodna z zasadami',
};

export function ReviewForm({ caseId, existing, defaultAuthor }: { caseId: string; existing?: Review; defaultAuthor: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, {});
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [open, setOpen] = useState(false);

  return (
    <details className="mt-4 rounded-lg border border-ink-700" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="text-amber-300">★</span>
        <span className="flex-1 text-paper-100">
          {existing ? (
            <>
              Twoja opinia: {existing.rating}/5 · <span className="text-muted">{STATUS[existing.status]}</span>
            </>
          ) : (
            'Oceń sprawę po rozwiązaniu'
          )}
        </span>
        <span className="text-xs text-brass-300">{existing ? 'Edytuj' : 'Dodaj opinię'}</span>
      </summary>
      <form action={action} className="space-y-4 border-t border-ink-800 px-4 py-4">
        <input type="hidden" name="caseId" value={caseId} />
        <input type="hidden" name="rating" value={rating || ''} />
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && <Notice tone="success">Dziękujemy! Opinia pojawi się na stronie po sprawdzeniu (zwykle w ciągu 1–2 dni).</Notice>}
        <fieldset>
          <legend className="label">Ocena</legend>
          <div className="flex gap-1" role="radiogroup" aria-label="Ocena w gwiazdkach">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} z 5`}
                onClick={() => setRating(n)}
                className={`text-3xl leading-none transition ${n <= rating ? 'text-amber-300' : 'text-ink-600 hover:text-amber-300/60'}`}
              >
                ★
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className="label">Opinia (bez zdradzania rozwiązania!)</span>
          <textarea name="body" required minLength={10} maxLength={1500} rows={4} className="input" defaultValue={existing?.body} placeholder="Jak się grało? Dla kogo polecasz tę sprawę?" />
        </label>
        <label className="block">
          <span className="label">Podpis</span>
          <input name="author" required minLength={2} maxLength={40} className="input" defaultValue={existing?.author_name ?? defaultAuthor} />
          <span className="mt-1 block text-xs text-muted">Widoczny publicznie przy opinii, np. „Kasia z Gdańska”. Nie podawaj nazwiska.</span>
        </label>
        <label className="flex gap-3 text-sm text-paper-200">
          <input type="checkbox" name="rules" required className="mt-1 h-4 w-4 shrink-0 accent-brass-400" />
          <span>
            Opinia dotyczy sprawy, którą rozwiązuję, nie zawiera spoilerów ani treści niezgodnych z{' '}
            <Link href="/regulamin#opinie" target="_blank" className="text-brass-300 underline">
              zasadami publikacji opinii
            </Link>
            .
          </span>
        </label>
        <button className="btn-primary" disabled={pending || !rating}>
          {pending ? 'Zapisuję…' : existing ? 'Zapisz zmiany' : 'Wyślij opinię'}
        </button>
      </form>
    </details>
  );
}
