import { NextResponse } from 'next/server';
import { siteConfig } from '@/lib/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Brak dostępu', { status: 401 });
  const db = createAdminClient();
  const { data: profile } = await db.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) return new NextResponse('Brak dostępu', { status: 403 });

  const { data } = await db.from('newsletter_subscribers').select('email, confirmed_at, token').eq('status', 'confirmed').order('confirmed_at');
  const csv = ['email,confirmed_at,unsubscribe_url']
    .concat((data ?? []).map((r) => `${r.email},${r.confirmed_at ?? ''},${siteConfig.url}/newsletter/wypisz?token=${r.token}`))
    .join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
