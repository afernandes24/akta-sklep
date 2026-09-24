import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/config';
import { isAdminUser, ownsCase, RECORDINGS_BUCKET } from '@/lib/online';
import { isUuid } from '@/lib/orders';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Odtwarzanie nagrania z przesłuchania: tylko dla posiadacza sprawy (PDF lub online) albo admina. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured() || !isUuid(id)) return new NextResponse('Nie znaleziono nagrania', { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Zaloguj się, aby odsłuchać nagranie', { status: 401 });

  const db = createAdminClient();
  const { data: rec } = await db.from('case_recordings').select('case_id, storage_path').eq('id', id).maybeSingle();
  if (!rec) return new NextResponse('Nie znaleziono nagrania', { status: 404 });

  const allowed = (await ownsCase(user.id, rec.case_id as string)) || (await isAdminUser(user.id));
  if (!allowed) return new NextResponse('Brak dostępu', { status: 403 });

  const { data } = await db.storage.from(RECORDINGS_BUCKET).createSignedUrl(rec.storage_path as string, 3 * 60 * 60);
  if (!data?.signedUrl) return new NextResponse('Nagranie chwilowo niedostępne', { status: 503 });
  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}
