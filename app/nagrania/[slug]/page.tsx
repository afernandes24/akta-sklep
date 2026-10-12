import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AI_NOTICE, RecordingsList } from '@/components/case/RecordingsList';
import { getUser } from '@/lib/auth';
import { isServiceRoleConfigured } from '@/lib/config';
import { isAdminUser, listRecordings, ownsCase } from '@/lib/online';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Nagrania z przesłuchań', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Strona pod kod QR z transkrypcji: nagrania jednej sprawy (#n1, #n2… przewija do konkretnego). */
export default async function RecordingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect(`/logowanie?next=${encodeURIComponent(`/nagrania/${slug}`)}`);
  if (!isServiceRoleConfigured()) redirect('/konto/sprawy');

  const { data: c } = await createAdminClient().from('cases').select('id, slug, title, case_number').eq('slug', slug).maybeSingle();
  if (!c) redirect('/konto/sprawy');
  const allowed = (await ownsCase(user.id, c.id as string)) || (await isAdminUser(user.id));
  const recordings = allowed ? await listRecordings([c.id as string]) : [];

  return (
    <section className="container-page max-w-3xl py-12 sm:py-16">
      <p className="eyebrow">Akta #{c.case_number as string}</p>
      <h1 className="mt-2 text-4xl font-bold">Nagrania z przesłuchań</h1>
      <p className="mt-2 text-paper-200">{c.title as string}</p>
      <div className="mt-8">
        {!allowed ? (
          <div className="card p-6 text-center">
            <p className="text-paper-200">Nagrania są dostępne dla osób, które kupiły tę sprawę. Zaloguj się kontem użytym przy zakupie.</p>
            <Link href={`/sprawy/${slug}`} className="btn-secondary mt-4">
              Zobacz sprawę
            </Link>
          </div>
        ) : recordings.length === 0 ? (
          <p className="text-paper-200">Nagrania do tej sprawy są w przygotowaniu.</p>
        ) : (
          <RecordingsList
            items={recordings.map(({ id, title, person, description, mime_type, duration_seconds }) => ({ id, title, person, description, mime_type, duration_seconds }))}
          />
        )}
      </div>
      {allowed && recordings.length === 0 && <p className="mt-4 text-xs text-muted">🤖 {AI_NOTICE}</p>}
    </section>
  );
}
