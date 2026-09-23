import type { Metadata } from 'next';
import Link from 'next/link';
import { Notice } from '@/components/ui/PageHeader';
import { isServiceRoleConfigured } from '@/lib/config';
import { FREE_CASE, getSubscriberByToken, sendFreeCaseEmail } from '@/lib/newsletter';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Twoja darmowa sprawa', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams;
  const sub = isServiceRoleConfigured() ? await getSubscriberByToken(token) : null;

  if (!sub) {
    return (
      <section className="container-page max-w-2xl py-20">
        <h1 className="text-4xl font-bold">Link jest nieprawidłowy</h1>
        <p className="mt-4 text-paper-200">Link mógł zostać skopiowany niecały. Zapisz się ponownie — wyślemy nowy.</p>
        <Link href="/darmowa-sprawa" className="btn-primary mt-6">
          Odbierz darmową sprawę
        </Link>
      </section>
    );
  }

  let justConfirmed = false;
  if (sub.status !== 'confirmed') {
    const { data } = await createAdminClient()
      .from('newsletter_subscribers')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), unsubscribed_at: null })
      .eq('id', sub.id)
      .neq('status', 'confirmed')
      .select('id');
    justConfirmed = Boolean(data?.length);
    if (justConfirmed) await sendFreeCaseEmail(sub.email, sub.token).catch(() => undefined);
  }

  return (
    <section className="container-page max-w-3xl py-16">
      <p className="eyebrow">Akta #{FREE_CASE.number}</p>
      <h1 className="mt-2 text-4xl font-bold">{justConfirmed ? 'Zapis potwierdzony!' : 'Twoja darmowa sprawa'}</h1>
      <p className="mt-4 text-paper-200">
        Pobierz pliki sprawy <strong>{FREE_CASE.title}</strong>. Wydrukuj pliki 01–04 i zacznij od instrukcji. Link do tej strony masz też w e-mailu.
      </p>
      <ul className="card mt-8 divide-y divide-ink-800">
        {FREE_CASE.files.map((f) => (
          <li key={f.name} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`font-mono text-sm ${f.solution ? 'text-stamp-500' : 'text-brass-300'}`}>{f.name}</p>
              <p className="text-xs text-muted">{f.label}</p>
            </div>
            <a href={`/api/darmowa-sprawa/${sub.token}/${f.name}`} className={`${f.solution ? 'btn-danger' : 'btn-secondary'} shrink-0 py-2 text-xs`} download>
              ↓ Pobierz PDF
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Notice>
          Spodobało się? Pełne akta mają 5 etapów, 5 podejrzanych i trudniejsze szyfry.{' '}
          <Link href="/sprawy" className="text-brass-300 underline">
            Zobacz wszystkie sprawy
          </Link>{' '}
          — przy zakupie 3 spraw płacisz o 20% mniej.
        </Notice>
      </div>
    </section>
  );
}
