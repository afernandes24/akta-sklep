'use client';

import { useActionState } from 'react';
import { saveQrCode, type QrState } from '@/app/admin/extra-actions';

export function QrForm({ suggestions, initial }: { suggestions: string[]; initial?: { code: string; label: string; target: string } }) {
  const [state, action, pending] = useActionState<QrState, FormData>(saveQrCode, {});
  const listId = initial ? `cele-${initial.code}` : 'cele-nowy';
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[140px_1fr_1fr_auto] sm:items-end">
      <label className="block">
        <span className="label">Kod</span>
        <input name="code" defaultValue={initial?.code} readOnly={Boolean(initial)} placeholder="006-n1" className="input py-1.5 font-mono text-sm" required />
      </label>
      <label className="block">
        <span className="label">Opis (dla Ciebie)</span>
        <input name="label" defaultValue={initial?.label} placeholder="Latarnik — nagranie 1" className="input py-1.5 text-sm" />
      </label>
      <label className="block">
        <span className="label">Dokąd prowadzi</span>
        <input name="target" defaultValue={initial?.target} list={listId} placeholder="/nagrania/latarnik#n1" className="input py-1.5 font-mono text-sm" required />
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>
      <button className="btn-primary py-2 text-sm" disabled={pending}>
        {pending ? '…' : initial ? 'Zapisz' : 'Dodaj'}
      </button>
      {(state.error || state.ok) && <p className={`text-xs sm:col-span-4 ${state.error ? 'text-stamp-500' : 'text-emerald-300'}`}>{state.error ?? state.ok}</p>}
    </form>
  );
}
