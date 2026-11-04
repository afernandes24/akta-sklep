'use client';

import { useEffect, useState } from 'react';
import { suggestEmail } from '@/lib/email-typo';

/**
 * Podpowiedź pod polem e-mail: „Czy chodziło o jan@gmail.com?” (literówki typu gmial.com, icloud.ocm).
 * Wystarczy dodać obok pola: <EmailTypoHint inputId="id-pola" />.
 */
export function EmailTypoHint({ inputId }: { inputId: string }) {
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const el = document.getElementById(inputId) as HTMLInputElement | null;
    if (!el) return;
    const check = () => setHint(el.value.includes('@') ? suggestEmail(el.value) : null);
    const onInput = () => hint && check();
    el.addEventListener('blur', check);
    el.addEventListener('input', onInput);
    el.form?.addEventListener('submit', check);
    return () => {
      el.removeEventListener('blur', check);
      el.removeEventListener('input', onInput);
      el.form?.removeEventListener('submit', check);
    };
  }, [inputId, hint]);

  if (!hint) return null;
  const apply = () => {
    const el = document.getElementById(inputId) as HTMLInputElement | null;
    if (!el) return;
    // Działa też dla pól kontrolowanych przez React
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, hint);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    setHint(null);
    el.focus();
  };
  return (
    <p className="mt-1.5 rounded-md border border-brass-400/40 bg-brass-400/10 px-3 py-2 text-sm text-paper-100" role="status">
      Czy chodziło o <strong className="text-brass-300">{hint}</strong>?{' '}
      <button type="button" onClick={apply} className="ml-1 font-semibold text-brass-300 underline underline-offset-2">
        Popraw
      </button>
    </p>
  );
}
