import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { safeNext } from '@/lib/safe-redirect';
import { createClient } from '@/lib/supabase/server';

/** Obsługa linków z e-maili: potwierdzenie konta i reset hasła. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get('next'));
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  return NextResponse.redirect(new URL(ok ? next : '/logowanie?blad=link', url.origin));
}
