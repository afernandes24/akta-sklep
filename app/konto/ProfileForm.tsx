'use client';

import { useActionState } from 'react';
import { type ProfileState, updateProfile } from './actions';

export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="full_name" className="label">
          Imię
        </label>
        <input id="full_name" name="full_name" defaultValue={fullName} className="input" autoComplete="given-name" />
      </div>
      <button type="submit" className="btn-secondary" disabled={pending}>
        {pending ? 'Zapisywanie…' : state.ok ? '✓ Zapisano' : 'Zapisz'}
      </button>
      {state.error && <p className="text-sm text-stamp-500">{state.error}</p>}
    </form>
  );
}
