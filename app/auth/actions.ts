'use server';

import { redirect } from 'next/navigation';
import { isSupabaseConfigured, siteConfig } from '@/lib/config';
import { safeNext } from '@/lib/safe-redirect';
import { createClient } from '@/lib/supabase/server';

export type AuthState = { error?: string; info?: string };

function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Nieprawidłowy e-mail lub hasło.';
  if (m.includes('email not confirmed')) return 'Najpierw potwierdź adres e-mail — link wysłaliśmy na twoją skrzynkę.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Konto z tym adresem już istnieje. Zaloguj się.';
  if (m.includes('password should be') || m.includes('weak password')) return 'Hasło jest za słabe — użyj co najmniej 8 znaków.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.';
  if (m.includes('same password')) return 'Nowe hasło musi różnić się od poprzedniego.';
  return 'Coś poszło nie tak. Spróbuj ponownie.';
}

const notConfigured: AuthState = { error: 'Logowanie będzie dostępne po podłączeniu bazy danych (Supabase).' };

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return notConfigured;
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translate(error.message) };
  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return notConfigured;
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('full_name') ?? '').trim().slice(0, 120);
  const next = safeNext(formData.get('next'));

  if (password.length < 8) return { error: 'Hasło musi mieć co najmniej 8 znaków.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteConfig.url}/auth/callback?next=${encodeURIComponent(next)}`,
      data: { full_name: fullName },
    },
  });
  if (error) return { error: translate(error.message) };
  if (data.session) redirect(next);
  return { info: `Wysłaliśmy link aktywacyjny na adres ${email}. Kliknij go, aby dokończyć rejestrację — twój koszyk będzie na ciebie czekał.` };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect('/');
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return notConfigured;
  const email = String(formData.get('email') ?? '').trim();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteConfig.url}/auth/callback?next=${encodeURIComponent('/konto/nowe-haslo')}`,
  });
  // Zawsze ta sama odpowiedź — nie zdradzamy, czy konto istnieje.
  return { info: 'Jeśli konto z tym adresem istnieje, wysłaliśmy link do ustawienia nowego hasła.' };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return notConfigured;
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) return { error: 'Hasło musi mieć co najmniej 8 znaków.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: translate(error.message) };
  return { info: 'Hasło zostało zmienione.' };
}
