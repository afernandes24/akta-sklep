'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Notice } from '@/components/ui/PageHeader';
import { type GuestReviewState, submitLinkReview } from './actions';

export function LinkReviewForm({
  email,
  token,
  caseId,
  title,
  initialRating,
  existing,
}: {
  email: string;
  token: string;
  caseId: string;
  title: string;
  initialRating?: number;
  existing?: { rating: number; body: string; author_name: string } | null;
}) {
  const [state, action, pending] = useActionState<GuestReviewState, FormData>(submitLinkReview, {});
  const [rating, setRating] = useState(existing?.rating ?? initialRating ?? 0);
  if (state.ok)
    return (
      <div className="card p-6 text-center">
        <p className="text-4xl">🔍</p>
        <p className="mt-2 font-serif text-2xl font-bold text-paper-50">Dziękujemy!</p>
        <p className="mt-2 text-paper-200">Opinia o „{title}” pojawi się na stronie po sprawdzeniu (zwykle w ciągu 1–2 dni).</p>
        <p className="mt-2 text-sm text-brass-300">W podziękowaniu wysłaliśmy ci mailem kod rabatowy na kolejną sprawę.</p>
        <Link href="/sprawy" className="btn-secondary mt-5">
          Zobacz inne sprawy
        </Link>
      </div>
    );
  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="e" value={email} />
      <input type="hidden" name="k" value={token} />
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="rating" value={rating || ''} />
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      {existing && <p className="text-sm text-muted">Masz już opinię o tej sprawie — możesz ją poprawić.</p>}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <div className="flex gap-1" role="radiogroup" aria-label="Ocena w gwiazdkach">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} z 5`}
            onClick={() => setRating(n)}
            className={`text-4xl leading-none transition ${n <= rating ? 'text-amber-300' : 'text-ink-600 hover:text-amber-300/60'}`}
          >
            ★
          </button>
        ))}
      </div>
      <label className="block">
        <span className="label">Twoja opinia (bez zdradzania rozwiązania!)</span>
        <textarea name="body" required minLength={10} maxLength={1500} rows={4} className="input" defaultValue={existing?.body} placeholder="Jak się grało? Dla kogo polecasz tę sprawę?" />
      </label>
      <label className="block">
        <span className="label">Podpis</span>
        <input name="author" required minLength={2} maxLength={40} className="input" defaultValue={existing?.author_name} placeholder="np. Kasia z Gdańska" />
        <span className="mt-1 block text-xs text-muted">Widoczny publicznie przy opinii. Nie podawaj nazwiska.</span>
      </label>
      <label className="flex gap-3 text-sm text-paper-200">
        <input type="checkbox" name="rules" required className="mt-1 h-4 w-4 shrink-0 accent-brass-400" />
        <span>
          Opinia dotyczy sprawy, którą kupiłem(-am), nie zawiera spoilerów ani treści niezgodnych z{' '}
          <Link href="/regulamin#opinie" target="_blank" className="text-brass-300 underline">
            zasadami publikacji opinii
          </Link>
          .
        </span>
      </label>
      <button className="btn-primary" disabled={pending || !rating}>
        {pending ? 'Wysyłam…' : 'Wyślij opinię'}
      </button>
    </form>
  );
}
