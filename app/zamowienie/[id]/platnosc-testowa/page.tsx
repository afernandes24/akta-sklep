import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { isUuid } from '@/lib/orders';
import { mockPaymentsAllowed } from '@/lib/payments/mock';
import { createClient } from '@/lib/supabase/server';
import { cancelMock, payMock } from './actions';

export const metadata: Metadata = { title: 'Płatność testowa', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function MockPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id) || !mockPaymentsAllowed()) notFound();
  await requireUser(`/zamowienie/${id}/platnosc-testowa`);

  const supabase = await createClient();
  const { data: order } = await supabase.from('orders').select('id, order_number, total_grosze, status, provider').eq('id', id).maybeSingle();
  if (!order || order.provider !== 'mock') notFound();

  return (
    <section className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8 text-center">
        <span className="stamp">Tryb testowy</span>
        <h1 className="mt-6 text-3xl font-bold">Symulacja płatności</h1>
        <p className="mt-3 text-sm text-paper-200">
          Tu w wersji produkcyjnej pojawi się strona operatora płatności (Stripe lub Przelewy24). Żadne pieniądze nie zostaną pobrane.
        </p>
        <p className="mt-6 font-mono text-sm text-muted">Zamówienie nr {order.order_number}</p>
        <p className="font-serif text-4xl font-bold text-paper-50">{formatPrice(order.total_grosze)}</p>
        {order.status === 'pending' ? (
          <div className="mt-8 flex flex-col gap-3">
            <form action={payMock}>
              <input type="hidden" name="orderId" value={order.id} />
              <button className="btn-primary w-full">Zapłać (test)</button>
            </form>
            <form action={cancelMock}>
              <input type="hidden" name="orderId" value={order.id} />
              <button className="btn-secondary w-full">Anuluj płatność</button>
            </form>
          </div>
        ) : (
          <p className="mt-8 text-paper-200">To zamówienie zostało już rozliczone.</p>
        )}
      </div>
    </section>
  );
}
