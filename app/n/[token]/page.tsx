import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AI_NOTICE } from '@/components/case/RecordingsList';
import { isServiceRoleConfigured } from '@/lib/config';
import { formatDuration } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Nagranie z przesłuchania', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Strona pod kod QR z wydrukowanych akt: odtwarzacz jednego nagrania, bez logowania. */
export default async function PublicRecordingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isServiceRoleConfigured() || !/^[0-9a-f]{32}$/.test(token)) notFound();
  const { data: r } = await createAdminClient()
    .from('case_recordings')
    .select('title, person, description, mime_type, duration_seconds, cases(title, case_number, slug)')
    .eq('public_token', token)
    .maybeSingle();
  if (!r) notFound();
  const c = (Array.isArray(r.cases) ? r.cases[0] : r.cases) as { title: string; case_number: string; slug: string } | null;
  const src = `/api/n/${token}`;

  return (
    <section className="container-page max-w-2xl py-10 sm:py-16">
      {c && <p className="eyebrow">Akta #{c.case_number} · {c.title}</p>}
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{r.title as string}</h1>
      {r.person && <p className="mt-2 text-paper-200">Przesłuchiwany: {r.person as string}</p>}
      <div className="card mt-6 p-4 sm:p-6">
        {(r.mime_type as string).startsWith('video/') ? (
          <video controls playsInline preload="metadata" className="w-full rounded bg-black" src={src} controlsList="nodownload" />
        ) : (
          <audio controls preload="metadata" className="w-full" src={src} controlsList="nodownload" />
        )}
        {r.duration_seconds ? <p className="mt-2 text-right font-mono text-xs text-muted">{formatDuration(r.duration_seconds as number)}</p> : null}
        {r.description && <p className="mt-3 text-sm text-paper-200">{r.description as string}</p>}
      </div>
      <p className="mt-4 text-xs text-muted">🤖 {AI_NOTICE}</p>
      <p className="mt-8 text-sm text-paper-200">
        Słuchaj uważnie — ton, pauzy i przejęzyczenia to też dowody. Wróć do akt, gdy skończysz.{' '}
        <Link href="/sprawy" className="text-brass-300 underline-offset-2 hover:underline">
          Inne sprawy
        </Link>
      </p>
    </section>
  );
}
