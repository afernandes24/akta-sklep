import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isServiceRoleConfigured, siteConfig } from '@/lib/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { PreviewForm } from './PreviewForm';

export const metadata: Metadata = { title: 'Wkrótce start', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type Settings = { is_open: boolean; headline: string; message: string; launch_label: string | null; preview_hash: string | null };

export default async function ComingSoonPage({ searchParams }: { searchParams: Promise<{ podglad?: string }> }) {
  const sp = await searchParams;
  let s: Settings = {
    is_open: true,
    headline: 'Śledztwo wkrótce się zacznie',
    message: 'Kończymy kompletować akta pierwszych spraw. Sklep ruszy już niedługo.',
    launch_label: null,
    preview_hash: null,
  };
  if (isServiceRoleConfigured()) {
    const { data } = await createAdminClient().from('site_settings').select('is_open, headline, message, launch_label, preview_hash').eq('id', 1).maybeSingle();
    if (data) s = data as Settings;
  }
  // Otwarty sklep nie potrzebuje tej strony (admin może ją podejrzeć: /wkrotce?podglad=1)
  if (s.is_open && !sp.podglad) redirect('/');

  const next = (await headers()).get('x-akta-path') || '/';

  return (
    // Pełny ekran nad nagłówkiem i stopką sklepu
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-ink-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,176,106,0.12),transparent_60%)]" aria-hidden />
      <main className="relative mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <svg aria-hidden width="56" height="56" viewBox="0 0 64 64">
          <circle cx="27" cy="27" r="14" fill="none" stroke="#d4b06a" strokeWidth="5" />
          <path d="M37 37 51 51" stroke="#d4b06a" strokeWidth="7" strokeLinecap="round" />
        </svg>
        <p className="mt-6 font-serif text-xl font-bold uppercase tracking-[0.2em] text-paper-50">{siteConfig.name}</p>
        <span className="stamp mt-8 text-sm">Akta w przygotowaniu</span>
        <h1 className="mt-8 text-4xl font-bold leading-tight sm:text-5xl">{s.headline}</h1>
        <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-paper-200">{s.message}</p>
        {s.launch_label && (
          <p className="mt-6 font-mono text-sm uppercase tracking-[0.2em] text-brass-300">Start: {s.launch_label}</p>
        )}

        {s.preview_hash && (
          <div className="mt-14 w-full border-t border-ink-800 pt-8">
            <p className="text-sm text-muted">Masz hasło do wcześniejszego dostępu?</p>
            <PreviewForm next={next} />
          </div>
        )}

        <nav className="mt-14 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted" aria-label="Informacje">
          <Link href="/kontakt" className="hover:text-brass-300">
            Kontakt
          </Link>
          <Link href="/regulamin" className="hover:text-brass-300">
            Regulamin
          </Link>
          <Link href="/polityka-prywatnosci" className="hover:text-brass-300">
            Polityka prywatności
          </Link>
          <Link href="/nota-prawna" className="hover:text-brass-300">
            Nota prawna
          </Link>
          <Link href="/logowanie?next=/admin" className="hover:text-brass-300">
            Logowanie
          </Link>
        </nav>
      </main>
    </div>
  );
}
