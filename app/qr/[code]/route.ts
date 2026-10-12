import { NextResponse } from 'next/server';
import { isServiceRoleConfigured, siteConfig } from '@/lib/config';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** Kod QR z PDF-a → /qr/<kod> → cel ustawiony w panelu (Admin → Kody QR). Każde wejście liczy skan. */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toLowerCase();
  let target = '/';
  if (isServiceRoleConfigured() && /^[a-z0-9-]{2,40}$/.test(code)) {
    const { data } = await createAdminClient().rpc('qr_hit', { p_code: code });
    if (typeof data === 'string' && data) target = data;
  }
  // Ścieżka w sklepie albo pełny adres https
  const url = target.startsWith('/') ? new URL(target, siteConfig.url) : /^https:\/\//.test(target) ? new URL(target) : new URL('/', siteConfig.url);
  const res = NextResponse.redirect(url, 302);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  return res;
}
