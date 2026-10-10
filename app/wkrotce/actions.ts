'use server';

import { cookies } from 'next/headers';
import { isServiceRoleConfigured } from '@/lib/config';
import { checkPreviewPassword, PREVIEW_COOKIE, PREVIEW_MAX_AGE, previewToken } from '@/lib/maintenance';
import { allow, clientIp } from '@/lib/rate-limit';
import { safeNext } from '@/lib/safe-redirect';
import { createAdminClient } from '@/lib/supabase/admin';

export type PreviewState = { error?: string; go?: string };

export async function enterPreview(_prev: PreviewState, formData: FormData): Promise<PreviewState> {
  if (!isServiceRoleConfigured()) return { error: 'Sklep nie jest połączony z bazą danych.' };
  if (!allow(`preview:${await clientIp()}`, 8, 10 * 60 * 1000)) return { error: 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.' };

  const password = String(formData.get('password') ?? '');
  const { data } = await createAdminClient().from('site_settings').select('preview_hash').eq('id', 1).maybeSingle();
  const hash = (data?.preview_hash as string | null) ?? null;
  if (!hash) return { error: 'Wejście na hasło jest wyłączone.' };
  if (!(await checkPreviewPassword(password, hash))) return { error: 'Nieprawidłowe hasło.' };

  (await cookies()).set(PREVIEW_COOKIE, await previewToken(hash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PREVIEW_MAX_AGE,
  });
  // Pełne przeładowanie po stronie przeglądarki — żeby middleware zobaczyło nowe ciasteczko
  const next = safeNext(String(formData.get('next') ?? '/'), '/');
  return { go: next.startsWith('/wkrotce') ? '/' : next };
}
