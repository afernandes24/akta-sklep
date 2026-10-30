'use client';

import { useActionState } from 'react';
import { Notice } from '@/components/ui/PageHeader';
import { type CodeState, createDiscountCode } from '../extra-actions';

export function DiscountCodeForm() {
  const [state, action, pending] = useActionState<CodeState, FormData>(createDiscountCode, {});
  return (
    <form action={action} className="card grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
      <h2 className="font-serif text-xl font-semibold sm:col-span-2 lg:col-span-4">Nowy kod rabatowy</h2>
      {state.error && (
        <div className="sm:col-span-2 lg:col-span-4">
          <Notice tone="error">{state.error}</Notice>
        </div>
      )}
      {state.ok && (
        <div className="sm:col-span-2 lg:col-span-4">
          <Notice tone="success">{state.ok}</Notice>
        </div>
      )}
      <label>
        <span className="label">Kod</span>
        <input name="code" required className="input font-mono uppercase" placeholder="POWITANIE10" maxLength={32} />
      </label>
      <label>
        <span className="label">Rodzaj</span>
        <select name="type" className="input">
          <option value="percent">Procent (%)</option>
          <option value="amount">Kwota (zł)</option>
          <option value="second">Druga sprawa taniej (%)</option>
        </select>
      </label>
      <label>
        <span className="label">Wartość</span>
        <input name="value" required className="input" placeholder="10" inputMode="decimal" />
        <span className="mt-1 block text-xs text-muted">Przy „druga sprawa taniej”: np. 50 = tańsza z każdej pary za pół ceny (min. 2 sprawy).</span>
      </label>
      <label>
        <span className="label">Min. liczba spraw</span>
        <input name="min_items" type="number" min={1} defaultValue={1} className="input" />
      </label>
      <label>
        <span className="label">Ważny do (opcjonalnie)</span>
        <input name="valid_until" type="date" className="input" />
      </label>
      <label>
        <span className="label">Limit użyć (opcjonalnie)</span>
        <input name="max_uses" type="number" min={1} className="input" placeholder="bez limitu" />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Notatka (widzi tylko admin)</span>
        <input name="note" className="input" placeholder="np. mail powitalny newslettera" />
      </label>
      <label className="flex items-center gap-3 text-sm text-paper-200 sm:col-span-2">
        <input type="checkbox" name="one_per_user" defaultChecked className="h-4 w-4 accent-brass-400" />
        Jeden raz na klienta
      </label>
      <div className="sm:col-span-2 lg:col-span-2 lg:text-right">
        <button className="btn-primary" disabled={pending}>
          {pending ? 'Zapisuję…' : 'Dodaj kod'}
        </button>
      </div>
    </form>
  );
}
