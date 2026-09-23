'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type ProfileState = { ok?: boolean; error?: string };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const fullName = String(formData.get('full_name') ?? '').trim().slice(0, 120);
  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update({ full_name: fullName || null }).eq('id', user.id);
  if (error) return { error: 'Nie udało się zapisać zmian.' };
  revalidatePath('/konto');
  return { ok: true };
}
