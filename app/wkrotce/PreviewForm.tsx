'use client';

import { useActionState, useEffect } from 'react';
import { enterPreview, type PreviewState } from './actions';

export function PreviewForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<PreviewState, FormData>(enterPreview, {});
  useEffect(() => {
    if (state.go) window.location.assign(state.go);
  }, [state.go]);
  return (
    <form action={action} className="mx-auto mt-3 flex max-w-sm flex-col gap-2 sm:flex-row">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="haslo" className="sr-only">
        Hasło
      </label>
      <input id="haslo" name="password" type="password" required autoComplete="current-password" placeholder="Hasło" className="input flex-1" />
      <button className="btn-secondary shrink-0" disabled={pending}>
        {pending || state.go ? 'Otwieram…' : 'Wejdź'}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-stamp-500 sm:basis-full">
          {state.error}
        </p>
      )}
    </form>
  );
}
