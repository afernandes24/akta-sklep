import type { Metadata } from 'next';
import { Notice, PageHeader } from '@/components/ui/PageHeader';
import { getUser } from '@/lib/auth';
import { getPaymentProvider, getPaymentProviderId } from '@/lib/payments';
import { CartView } from './CartView';
import { getPublishedCases } from '@/lib/cases';
import { getBestsellers } from '@/lib/promo';

export const metadata: Metadata = { title: 'Koszyk', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function CartPage({ searchParams }: { searchParams: Promise<{ anulowano?: string }> }) {
  const sp = await searchParams;
  const user = await getUser();
  const provider = getPaymentProvider();
  // Podpowiedzi „dodaj jeszcze jedną” (najchętniej kupowane)
  const cases = await getPublishedCases().catch(() => []);
  const top = await getBestsellers(cases, cases.length).catch(() => cases);
  const suggestions = top.slice(0, 6).map((c) => ({ id: c.id, slug: c.slug, title: c.title, caseNumber: c.case_number, priceGrosze: c.price_grosze, coverPath: c.cover_path }));

  return (
    <>
      <PageHeader eyebrow="Zamówienie" title="Koszyk" />
      <section className="container-page">
        {sp.anulowano && (
          <div className="mb-6">
            <Notice tone="warning">Płatność została przerwana. Twój koszyk jest nadal zapisany — możesz spróbować ponownie.</Notice>
          </div>
        )}
        <CartView
          loggedIn={Boolean(user)}
          email={user?.email ?? null}
          paymentsReady={Boolean(provider)}
          testMode={getPaymentProviderId() === 'mock' && Boolean(provider)}
          providerLabel={provider?.label ?? '—'}
          suggestions={suggestions}
        />
      </section>
    </>
  );
}
