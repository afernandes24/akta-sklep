import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountNav } from '@/components/account/AccountNav';
import { CaseDownloads } from '@/components/account/CaseDownloads';
import { Notice } from '@/components/ui/PageHeader';
import { getProfile, requireUser } from '@/lib/auth';
import { getUserLibrary } from '@/lib/library';
import { getUserReviews } from '@/lib/reviews';

export const metadata: Metadata = { title: 'Moje sprawy', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function MyCasesPage({ searchParams }: { searchParams: Promise<{ info?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser('/konto/sprawy');
  const [profile, library, reviews] = await Promise.all([getProfile(), getUserLibrary(user.id), getUserReviews(user.id)]);
  const defaultAuthor = (profile?.full_name ?? '').split(' ')[0] ?? '';

  return (
    <section className="container-page py-12">
      <p className="eyebrow">Twoje archiwum</p>
      <h1 className="mt-2 text-4xl font-bold">Moje sprawy</h1>
      <div className="mt-8">
        <AccountNav active="sprawy" isAdmin={profile?.is_admin} />
      </div>

      {sp.info === 'posiadane' && (
        <div className="mt-6">
          <Notice tone="success">Masz już te sprawy na koncie — nie musisz kupować ich ponownie. Pobierz pliki poniżej.</Notice>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {library.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-lg text-paper-200">Nie masz jeszcze żadnych spraw.</p>
            <Link href="/sprawy" className="btn-primary mt-6">
              Przeglądaj sprawy
            </Link>
          </div>
        ) : (
          <>
            <Notice>
              Wskazówka: wydrukuj akta sprawy i idź cel po celu. Wskazówki i odpowiedzi są schowane pod każdą sprawą — otwieraj je dopiero, gdy będą potrzebne.
            </Notice>
            {library.map((entry) => (
              <CaseDownloads key={entry.caseItem.id} entry={entry} review={reviews[entry.caseItem.id]} defaultAuthor={defaultAuthor} />
            ))}
          </>
        )}
      </div>
    </section>
  );
}
