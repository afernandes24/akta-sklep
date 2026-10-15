import { NextResponse } from 'next/server';
import { isServiceRoleConfigured } from '@/lib/config';
import { getOrderByToken, orderIncludesCase } from '@/lib/guest';
import { RECORDINGS_BUCKET } from '@/lib/online';
import { isUuid } from '@/lib/orders';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Nagranie z przesłuchania dla zakupu bez konta (dowolna wersja sprawy). */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;
  if (!isServiceRoleConfigured() || !isUuid(id)) return new NextResponse('Nie znaleziono nagrania', { status: 404 });
  const order = await getOrderByToken(token);
  if (!order || order.status !== 'paid') return new NextResponse('Brak dostępu', { status: 403 });

  const db = createAdminClient();
  const { data: rec } = await db.from('case_recordings').select('case_id, storage_path').eq('id', id).maybeSingle();
  if (!rec || !orderIncludesCase(order, rec.case_id as string)) return new NextResponse('Nie znaleziono nagrania', { status: 404 });

  const { data } = await db.storage.from(RECORDINGS_BUCKET).createSignedUrl(rec.storage_path as string, 3 * 60 * 60);
  if (!data?.signedUrl) return new NextResponse('Nagranie chwilowo niedostępne', { status: 503 });
  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}
