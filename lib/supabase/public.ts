import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Klient anonimowy bez ciasteczek — do publicznych danych katalogu.
 * Dzięki temu strony sklepu mogą być cache'owane (ISR) i szybkie.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
