import type { Metadata } from 'next';
import { Notice, PageHeader } from '@/components/ui/PageHeader';
import { getUser } from '@/lib/auth';
import { getPaymentProvider, getPaymentProviderId } from '@/lib/payments';
import { CartView } from './CartView';

export const metadata: Metadata = { title: 'Koszyk', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function CartPage({ searchParams }: { searchParams: Promise<{ anulowano?: string }> }) {
  const sp = await searchParams;
  const user = await getUser();
  const provider = getPaymentProvider();

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
        />
      </section>
    </>
  );
}
