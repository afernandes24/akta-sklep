import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { unsubscribe } from '@/app/darmowa-sprawa/actions';

export const metadata: Metadata = { title: 'Wypisz się z newslettera', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; ok?: string }> }) {
  const { token = '', ok } = await searchParams;

  async function action(formData: FormData) {
    'use server';
    await unsubscribe(formData);
    redirect('/newsletter/wypisz?ok=1');
  }

  return (
    <section className="container-page max-w-xl py-20 text-center">
      {ok ? (
        <>
          <h1 className="text-4xl font-bold">Wypisano</h1>
          <p className="mt-4 text-paper-200">Nie wyślemy ci więcej newslettera. Pobrana sprawa próbna zostaje twoja.</p>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-bold">Wypisać cię z newslettera?</h1>
          <p className="mt-4 text-paper-200">Przestaniesz dostawać informacje o nowych sprawach i kodach rabatowych.</p>
          <form action={action} className="mt-8">
            <input type="hidden" name="token" value={token} />
            <button className="btn-primary">Tak, wypisz mnie</button>
          </form>
        </>
      )}
    </section>
  );
}
