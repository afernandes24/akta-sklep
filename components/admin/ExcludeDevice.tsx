'use client';

import { useEffect, useState } from 'react';
import { isExcludedClient, setExcludedClient } from '@/lib/exclude';

/** W panelu admina: oznacza to urządzenie jako „nie licz” (raz, potem działa także po wylogowaniu). */
export function AutoExcludeDevice() {
  useEffect(() => {
    try {
      if (!isExcludedClient()) setExcludedClient(true);
    } catch {
      /* bez znaczenia dla działania panelu */
    }
  }, []);
  return null;
}

/** Przełącznik w Statystykach — np. żeby sprawdzić, czy liczenie działa. */
export function ExcludeToggle() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => setOn(isExcludedClient()), []);
  if (on === null) return null;
  return (
    <div className="card flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p>
        {on ? (
          <>
            <strong className="text-emerald-300">To urządzenie nie jest liczone</strong> w statystykach ani w Google Analytics.
          </>
        ) : (
          <>
            <strong className="text-brass-300">To urządzenie jest liczone</strong> jak zwykły odwiedzający.
          </>
        )}{' '}
        <span className="text-muted">Na telefonie zaloguj się raz do panelu, a wyłączy się samo.</span>
      </p>
      <button
        type="button"
        className="btn-secondary shrink-0 py-2 text-xs"
        onClick={() => {
          setExcludedClient(!on);
          setOn(!on);
        }}
      >
        {on ? 'Licz to urządzenie' : 'Nie licz tego urządzenia'}
      </button>
    </div>
  );
}
