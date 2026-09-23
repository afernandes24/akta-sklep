import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { isSupabaseConfigured } from './config';
import { createClient } from './supabase/server';
import type { Profile } from './types';

export async function getUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser(nextPath = '/konto') {
  const user = await getUser();
  if (!user) redirect(`/logowanie?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_admin, created_at')
    .eq('id', user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

/** Wpuszcza tylko administratorów. Innym pokazuje 404, żeby nie zdradzać istnienia panelu. */
export async function requireAdmin() {
  const user = await requireUser('/admin');
  const profile = await getProfile();
  if (!profile?.is_admin) notFound();
  return { user, profile };
}
