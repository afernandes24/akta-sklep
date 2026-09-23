'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { type AuthState, requestPasswordReset, signIn, signUp, updatePassword } from '@/app/auth/actions';
import { Notice } from '@/components/ui/PageHeader';

function Messages({ state }: { state: AuthState }) {
  return (
    <>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.info && <Notice tone="success">{state.info}</Notice>}
    </>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-5">
      <Messages state={state} />
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="label">
          E-mail
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="label">
            Hasło
          </label>
          <Link href="/nie-pamietam-hasla" className="mb-1.5 text-xs text-brass-300 hover:underline">
            Nie pamiętasz hasła?
          </Link>
        </div>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Logowanie…' : 'Zaloguj się'}
      </button>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  if (state.info) return <Messages state={state} />;
  return (
    <form action={action} className="space-y-5">
      <Messages state={state} />
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="full_name" className="label">
          Imię <span className="text-muted">(opcjonalnie)</span>
        </label>
        <input id="full_name" name="full_name" autoComplete="given-name" className="input" />
      </div>
      <div>
        <label htmlFor="email" className="label">
          E-mail
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Hasło <span className="text-muted">(min. 8 znaków)</span>
        </label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Zakładanie konta…' : 'Załóż konto'}
      </button>
      <p className="text-xs leading-relaxed text-muted">
        Zakładając konto, akceptujesz{' '}
        <Link href="/regulamin" className="underline hover:text-brass-300">
          regulamin
        </Link>{' '}
        i{' '}
        <Link href="/polityka-prywatnosci" className="underline hover:text-brass-300">
          politykę prywatności
        </Link>
        .
      </p>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  if (state.info) return <Messages state={state} />;
  return (
    <form action={action} className="space-y-5">
      <Messages state={state} />
      <div>
        <label htmlFor="email" className="label">
          E-mail podany przy rejestracji
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Wysyłanie…' : 'Wyślij link'}
      </button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-5">
      <Messages state={state} />
      <div>
        <label htmlFor="password" className="label">
          Nowe hasło <span className="text-muted">(min. 8 znaków)</span>
        </label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Zapisywanie…' : 'Ustaw nowe hasło'}
      </button>
    </form>
  );
}
