import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Klient z kluczem service_role — omija RLS.
 * Używaj WYŁĄCZNIE po stronie serwera i zawsze po własnej weryfikacji uprawnień.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w zmiennych środowiskowych.');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
