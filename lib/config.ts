import { SUPABASE_URL } from './supabase/url';
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'Akta Detektywa',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  description:
    'Fabularne gry detektywistyczne do druku. Pobierz akta sprawy w PDF, wydrukuj dowody, przesłuchaj podejrzanych i sam wskaż winnego.',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'afernandes2004@icloud.com',
  locale: 'pl_PL',
};

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isServiceRoleConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function publicStorageUrl(bucket: 'covers' | 'previews', path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path) || path.startsWith('/')) return path;
  const base = SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${path}`;
}
