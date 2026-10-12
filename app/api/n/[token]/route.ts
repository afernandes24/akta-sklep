import { NextResponse } from 'next/server';
import { isServiceRoleConfigured } from '@/lib/config';
import { RECORDINGS_BUCKET } from '@/lib/online';
import { allow, clientIp } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Plik nagrania dla linku z kodu QR (bez logowania) — tylko z tajnym, nieodgadywalnym tokenem. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isServiceRoleConfigured() || !/^[0-9a-f]{32}$/.test(token)) return new NextResponse('Nie znaleziono', { status: 404 });
  if (!allow(`n:${await clientIp()}`, 60, 10 * 60 * 1000)) return new NextResponse('Zbyt wiele prób', { status: 429 });
  const db = createAdminClient();
  const { data } = await db.from('case_recordings').select('storage_path').eq('public_token', token).maybeSingle();
  if (!data) return new NextResponse('Nie znaleziono', { status: 404 });
  const { data: signed } = await db.storage.from(RECORDINGS_BUCKET).createSignedUrl(data.storage_path as string, 3 * 60 * 60);
  if (!signed?.signedUrl) return new NextResponse('Chwilowo niedostępne', { status: 503 });
  const res = NextResponse.redirect(signed.signedUrl, 302);
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}
