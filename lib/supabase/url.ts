/**
 * Adres projektu Supabase bez końcowego „/” i bez dopisków typu /rest/v1 —
 * częsty błąd przy kopiowaniu z panelu („Invalid path specified in request URL”).
 */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/(rest|auth|storage)\/v1$/, '');
