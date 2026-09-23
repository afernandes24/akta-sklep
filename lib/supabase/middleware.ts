import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { siteConfig } from '../config';
import { SUPABASE_URL } from './url';

const PROTECTED_PREFIXES = ['/konto', '/admin', '/zamowienie'];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Nie wstawiaj kodu między createServerClient a getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!user && PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    // Adres sklepu z konfiguracji — za proxy (Railway) adres z żądania to wewnętrzny localhost:8080.
    const url = new URL('/logowanie', siteConfig.url);
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  return response;
}
