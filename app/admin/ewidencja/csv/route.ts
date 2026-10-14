import { NextResponse } from 'next/server';
import { buildEwidencja, ewidencjaCsv } from '@/lib/ewidencja';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Brak dostępu', { status: 401 });
  const db = createAdminClient();
  const { data: profile } = await db.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) return new NextResponse('Brak dostępu', { status: 403 });

  const y = Number(new URL(req.url).searchParams.get('rok'));
  const year = Number.isInteger(y) && y > 2000 && y < 3000 ? y : new Date().getFullYear();
  const { rows } = await buildEwidencja(year);
  return new NextResponse(ewidencjaCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ewidencja-sprzedazy-${year}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
