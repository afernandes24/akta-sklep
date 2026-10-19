'use client';

import { useState } from 'react';
import { deleteCase } from '@/app/admin/actions';

/** Usuwanie sprawy z potwierdzeniem: trzeba wpisać jej numer. */
export function DeleteCaseForm({ id, caseNumber, title }: { id: string; caseNumber: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const ok = value.trim().replace(/^#/, '') === caseNumber;

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-danger mt-3 w-full text-xs">
        Usuń sprawę na stałe…
      </button>
    );

  return (
    <form action={deleteCase} className="mt-3 space-y-2">
      <input type="hidden" name="id" value={id} />
      <p className="text-xs text-paper-200">
        Na pewno usunąć <b className="text-paper-50">#{caseNumber} {title}</b> razem z plikami? Wpisz numer sprawy <b className="font-mono text-paper-50">{caseNumber}</b>, aby potwierdzić.
      </p>
      <input name="confirm" value={value} onChange={(e) => setValue(e.target.value)} className="input py-2 font-mono" placeholder={caseNumber} autoComplete="off" autoFocus />
      <div className="flex gap-2">
        <button type="button" onClick={() => (setOpen(false), setValue(''))} className="btn-secondary flex-1 py-2 text-xs">
          Anuluj
        </button>
        <button className="btn-danger flex-1 text-xs" disabled={!ok}>
          Usuń
        </button>
      </div>
    </form>
  );
}
