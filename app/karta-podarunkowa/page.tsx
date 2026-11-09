import type { Metadata } from 'next';
import Link from 'next/link';
import { Notice, PageHeader } from '@/components/ui/PageHeader';
import { getUser } from '@/lib/auth';
import { GIFT_CARD_AMOUNTS } from '@/lib/gifts';
import { getPaymentProvider } from '@/lib/payments';
import { GiftCardForm } from './GiftCardForm';

export const metadata: Metadata = {
  title: 'Karta podarunkowa – gra detektywistyczna na prezent',
  description: 'Karta podarunkowa Akta Detektywa: obdarowany sam wybiera sprawę kryminalną do druku. Wysyłka mailem w wybranym dniu, ważna 12 miesięcy.',
  alternates: { canonical: '/karta-podarunkowa' },
};
export const dynamic = 'force-dynamic';

export default async function GiftCardPage({ searchParams }: { searchParams: Promise<{ anulowano?: string }> }) {
  const sp = await searchParams;
  const user = await getUser();
  return (
    <>
      <PageHeader eyebrow="Prezent" title="Karta podarunkowa">
        Nie wiesz, którą sprawę wybrać? Podaruj kartę — obdarowany sam wybierze śledztwo. Wyślemy ją mailem w dniu, który wskażesz (np. 24 grudnia rano).
      </PageHeader>
      <section className="container-page grid max-w-5xl gap-10 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-5 text-paper-200">
          <div className="card p-6">
            <h2 className="font-serif text-xl font-semibold text-paper-50">Jak to działa</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              <li>Wybierasz wartość, podajesz e-mail obdarowanego, podpis i liścik.</li>
              <li>W wybranym dniu obdarowany dostaje elegancki mail z kodem karty.</li>
              <li>Wybiera sprawy, a kod odejmuje kwotę w koszyku. Reszta salda zostaje na kolejne zakupy.</li>
            </ol>
          </div>
          <p className="text-sm">
            Wolisz podarować konkretną sprawę? Dodaj ją do koszyka i zaznacz <strong>„To prezent”</strong> —{' '}
            <Link href="/sprawy" className="text-brass-300 underline-offset-4 hover:underline">
              wybierz sprawę
            </Link>
            .
          </p>
        </div>
        <div>
          {sp.anulowano && (
            <div className="mb-4">
              <Notice tone="warning">Płatność została przerwana — możesz spróbować ponownie.</Notice>
            </div>
          )}
          <GiftCardForm amounts={GIFT_CARD_AMOUNTS} email={user?.email ?? null} paymentsReady={Boolean(getPaymentProvider())} />
        </div>
      </section>
    </>
  );
}
