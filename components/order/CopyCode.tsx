'use client';

import { useEffect, useState } from 'react';

/** Kod do skopiowania (+ opcjonalnie „Udostępnij” na telefonie). */
export function CopyCode({ code, share }: { code: string; share?: string }) {
  const [done, setDone] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === 'function'), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share ?? code);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* brak schowka — kod i tak jest widoczny */
    }
  };
  const shareIt = async () => {
    try {
      await navigator.share({ text: share });
    } catch {
      void copy();
    }
  };
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="rounded-md border-2 border-dashed border-brass-400/70 px-4 py-2 font-mono text-lg font-bold tracking-widest text-brass-300">{code}</span>
      <button type="button" onClick={copy} className="btn-secondary py-2 text-sm">
        {done ? 'Skopiowano ✓' : share ? 'Kopiuj wiadomość' : 'Kopiuj kod'}
      </button>
      {share && canShare && (
        <button type="button" onClick={shareIt} className="btn-primary py-2 text-sm">
          Udostępnij
        </button>
      )}
    </div>
  );
}
