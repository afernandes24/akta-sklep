'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Drugie pole „Powtórz e-mail” — mniej literówek w adresie (pliki i link idą na ten mail).
 * Przeglądarka nie wyśle formularza, dopóki oba adresy nie są takie same. Wklejanie jest zablokowane,
 * żeby nie skopiować tej samej literówki.
 */
export function EmailConfirm({ inputId, name = 'email_confirm' }: { inputId: string; name?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [mismatch, setMismatch] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const first = document.getElementById(inputId) as HTMLInputElement | null;
    const second = ref.current;
    if (!first || !second) return;
    const check = () => {
      const bad = second.value.trim() !== '' && second.value.trim().toLowerCase() !== first.value.trim().toLowerCase();
      second.setCustomValidity(bad ? 'Adresy e-mail się różnią — sprawdź, czy nie ma literówki.' : '');
      setMismatch(bad);
    };
    first.addEventListener('input', check);
    second.addEventListener('input', check);
    return () => {
      first.removeEventListener('input', check);
      second.removeEventListener('input', check);
    };
  }, [inputId]);

  const id = `${inputId}-confirm`;
  return (
    <div className="mt-3">
      <label htmlFor={id} className="label">
        Powtórz e-mail
      </label>
      <input
        ref={ref}
        id={id}
        name={name}
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        maxLength={200}
        className="input"
        onPaste={(e) => e.preventDefault()}
        onBlur={() => setTouched(true)}
      />
      {mismatch && touched && <p className="mt-1.5 text-xs text-stamp-500">Adresy się różnią — sprawdź, czy nie ma literówki.</p>}
    </div>
  );
}

