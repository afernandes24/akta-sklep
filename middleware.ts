import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  // Sesję odświeżamy tylko tam, gdzie jest potrzebna — strony katalogu zostają statyczne.
  matcher: ['/konto/:path*', '/admin/:path*', '/zamowienie/:path*', '/koszyk', '/logowanie', '/rejestracja', '/auth/:path*', '/api/pobierz/:path*'],
};
