import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OnlineReader } from '@/components/online/OnlineReader';
import { getUser } from '@/lib/auth';
import { buildDocuments, checkOnlineAccess, listRecordings, loadOnline, readReading } from '@/lib/online';

export const metadata: Metadata = { title: 'Akta online', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="container-page max-w-2xl py-20 text-center">
      <h1 className="text-4xl font-bold">{title}</h1>
      <div className="mt-4 text-paper-200">{children}</div>
    </section>
  );
}

export default async function OnlinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect(`/logowanie?next=${encodeURIComponent(`/online/${slug}`)}`);

  const o = await loadOnline(slug);
  const access = await checkOnlineAccess(o, user.id);
  if (!access.ok || !o?.manifest) {
    const reason = access.ok ? 'not-ready' : access.reason;
    if (reason === 'not-owned')
      return (
        <Message title="Ta sprawa czeka na zakup">
          <p>Aby czytać akta w przeglądarce, kup wersję online tej sprawy.</p>
          <Link href={`/sprawy/${slug}`} className="btn-primary mt-6">
            Zobacz sprawę
          </Link>
        </Message>
      );
    if (reason === 'not-ready')
      return (
        <Message title="Wersja online jest w przygotowaniu">
          <p>Masz ją już na koncie — pojawi się tutaj automatycznie, gdy będzie gotowa.</p>
          <Link href="/konto/sprawy" className="btn-secondary mt-6">
            Moje sprawy
          </Link>
        </Message>
      );
    return (
      <Message title="Nie znaleziono sprawy">
        <Link href="/konto/sprawy" className="btn-secondary mt-6">
          Moje sprawy
        </Link>
      </Message>
    );
  }

  const [reading, recordings] = await Promise.all([readReading(user.id, o.caseId), listRecordings([o.caseId])]);
  const documents = await buildDocuments(o.manifest, Boolean(reading.solutionOpenedAt));

  return (
    <OnlineReader
      slug={o.slug}
      title={o.title}
      caseNumber={o.caseNumber}
      documents={documents}
      recordings={recordings.map(({ id, title, person, description, mime_type, duration_seconds }) => ({
        id,
        title,
        person,
        description,
        mime_type,
        duration_seconds,
      }))}
      initialNotes={reading.notes}
      viewerLabel={user.email ?? ''}
      preview={access.preview}
    />
  );
}
