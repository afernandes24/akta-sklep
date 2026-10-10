import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSiteStatus, hasValidPreviewCookie, isAdminId, isAlwaysOpen, PREVIEW_COOKIE } from '@/lib/maintenance';
import { updateSession } from '@/lib/supabase/middleware';
import { SUPABASE_URL } from '@/lib/supabase/url';

/** Ścieżki, na których odświeżamy sesję logowania (reszta stron zostaje statyczna). */
const SESSION_PATHS = ['/konto', '/admin', '/zamowienie', '/koszyk', '/logowanie', '/rejestracja', '/auth', '/api/pobierz', '/api/nagranie', '/online'];

async function isAdminRequest(request: NextRequest): Promise<boolean> {
  if (!request.cookies.getAll().some((c) => c.name.startsWith('sb-'))) return false;
  const supabase = createServerClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: () => undefined },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? isAdminId(user.id) : false;
}

/** Sklep zamknięty → goście widzą stronę „Wkrótce” (adres w pasku zostaje bez zmian). */
async function maintenanceGate(request: NextRequest): Promise<NextResponse | null> {
  const path = request.nextUrl.pathname;
  if (isAlwaysOpen(path)) return null;
  const status = await getSiteStatus();
  if (status.isOpen) return null;
  if (await hasValidPreviewCookie(request.cookies.get(PREVIEW_COOKIE)?.value, status)) return null;
  if (await isAdminRequest(request)) return null;

  const headers = new Headers(request.headers);
  headers.set('x-akta-path', path + request.nextUrl.search);
  const res = NextResponse.rewrite(new URL('/wkrotce', request.url), { request: { headers } });
  res.headers.set('X-Robots-Tag', 'noindex');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }
  const gate = await maintenanceGate(request);
  if (gate) return gate;

  const path = request.nextUrl.pathname;
  if (SESSION_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return updateSession(request);
  return NextResponse.next();
}

export const config = {
  // Wszystko poza plikami statycznymi (tryb „Wkrótce” musi objąć każdą stronę).
  matcher: ['/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)'],
};
