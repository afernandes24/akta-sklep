import { NextResponse } from 'next/server';
import { isServiceRoleConfigured, siteConfig } from '@/lib/config';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** <nr sprawy>-n<kolejność> → publiczny odtwarzacz nagrania (/n/<token>); brak nagrania → strona sprawy. */
async function recordingTarget(caseNumber: string, n: number): Promise<string | null> {
  const db = createAdminClient();
  const { data: c } = await db.from('cases').select('id, slug').eq('case_number', caseNumber).maybeSingle();
  if (!c) return null;
  const { data: recs } = await db.from('case_recordings').select('public_token').eq('case_id', c.id).order('sort_order').order('created_at');
  const token = recs?.[n - 1]?.public_token as string | undefined;
  return token ? `/n/${token}` : `/sprawy/${c.slug}`;
}

/** Kod QR z PDF-a → /qr/<kod> → cel ustawiony w panelu (Admin → Kody QR). Każde wejście liczy skan. */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toLowerCase();
  let target = '/';
  if (isServiceRoleConfigured() && /^[a-z0-9-]{2,40}$/.test(code)) {
    const { data } = await createAdminClient().rpc('qr_hit', { p_code: code });
    if (typeof data === 'string' && data) target = data;
    else {
      // Kod nagrania z PDF-a (np. 006-n1) działa od razu po wgraniu nagrania — bez ręcznego tworzenia kodu w panelu
      const m = code.match(/^(\d{3})-n(\d{1,2})$/);
      if (m) target = (await recordingTarget(m[1], Number(m[2]))) ?? target;
    }
  }
  // Ścieżka w sklepie albo pełny adres https
  const url = target.startsWith('/') ? new URL(target, siteConfig.url) : /^https:\/\//.test(target) ? new URL(target) : new URL('/', siteConfig.url);
  const res = NextResponse.redirect(url, 302);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  return res;
}
