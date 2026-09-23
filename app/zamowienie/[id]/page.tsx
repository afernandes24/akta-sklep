import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutoRefresh } from '@/components/account/AutoRefresh';
import { CaseDownloads } from '@/components/account/CaseDownloads';
import { ClearPurchasedFromCart } from '@/components/account/ClearPurchasedFromCart';
import { StatusBadge } from '@/components/account/StatusBadge';
import { TrackPurchase } from '@/components/consent/TrackEvents';
import { Notice } from '@/components/ui/PageHeader';
import { requireUser } from '@/lib/auth';
import { formatDate, formatPrice } from '@/lib/format';
import { getUserLibrary } from '@/lib/library';
import { isUuid } from '@/lib/orders';
import { getProviderById } from '@/lib/payments';
import { createClient } from '@/lib/supabase/server';
import type { Order } from '@/lib/types';

export const metadata: Metadata = { title: 'Zamówienie', robots: { index: false } };
export const dynamic = 'force-dynamic';

async function loadOrder(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('orders')
    .select('id, order_number, user_id, email, status, total_grosze, currency, provider, provider_ref, created_at, paid_at, order_items(id, order_id, case_id, title, price_grosze)')
    .eq('id', id)
    .maybeSingle();
  return (data as Order | null) ?? null;
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();
  const user = await requireUser(`/zamowienie/${id}`);

  let order = await loadOrder(id);
  if (!order) notFound();

  // Jeśli webhook jeszcze nie dotarł — sprawdzamy status bezpośrednio u operatora.
  if (order.status === 'pending') {
    const provider = getProviderById(order.provider);
    if (provider?.confirmOnReturn) {
      await provider.confirmOnReturn(order, sp);
      order = (await loadOrder(id)) ?? order;
    }
  }

  const caseIds = (order.order_items ?? []).map((i) => i.case_id).filter((x): x is string => Boolean(x));
  const paid = order.status === 'paid';
  const library = paid && order.user_id === user.id ? await getUserLibrary(user.id, caseIds) : [];

  return (
    <section className="container-page max-w-4xl py-12 sm:py-16">
      {paid && <ClearPurchasedFromCart caseIds={caseIds} />}
      {paid && (
        <TrackPurchase
          id={order.id}
          totalGrosze={order.total_grosze}
          items={(order.order_items ?? []).map((i) => ({ id: i.case_id ?? i.id, title: i.title, priceGrosze: i.price_grosze }))}
        />
      )}
      {order.status === 'pending' && <AutoRefresh />}

      <div className="text-center">
        {paid ? <span className="stamp text-base">Opłacono</span> : <StatusBadge status={order.status} />}
        <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
          {paid ? 'Akta są twoje' : order.status === 'pending' ? 'Czekamy na potwierdzenie płatności' : 'Płatność nie powiodła się'}
        </h1>
        <p className="mt-4 text-paper-200">
          Zamówienie nr <span className="font-mono text-paper-50">{order.order_number}</span> · {formatDate(order.created_at)}
        </p>
      </div>

      <div className="mt-10">
        {order.status === 'pending' && (
          <Notice>To zwykle trwa kilka sekund. Strona odświeży się sama. Jeśli płatność została pobrana, a status się nie zmienia — napisz do nas.</Notice>
        )}
        {(order.status === 'failed' || order.status === 'cancelled') && (
          <Notice tone="error">
            Płatność została anulowana lub odrzucona. Nie pobraliśmy żadnych środków.{' '}
            <Link href="/koszyk" className="underline">
              Wróć do koszyka
            </Link>
          </Notice>
        )}
      </div>

      <div className="card mt-8 p-6">
        <h2 className="font-serif text-xl font-semibold">Podsumowanie zamówienia</h2>
        <ul className="mt-4 divide-y divide-ink-800 text-sm">
          {(order.order_items ?? []).map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-2.5">
              <span className="text-paper-200">{item.title}</span>
              <span className="shrink-0 text-paper-50">{formatPrice(item.price_grosze)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-ink-700 pt-3 font-semibold">
          <span>Razem</span>
          <span>{formatPrice(order.total_grosze)}</span>
        </div>
      </div>

      {paid && (
        <div className="mt-10 space-y-6">
          <h2 className="text-3xl font-bold">Pobierz materiały</h2>
          {library.map((entry) => (
            <CaseDownloads key={entry.caseItem.id} entry={entry} />
          ))}
          <p className="text-sm text-muted">
            Pliki zawsze znajdziesz w zakładce{' '}
            <Link href="/konto/sprawy" className="text-brass-300 hover:underline">
              Moje sprawy
            </Link>
            .
          </p>
        </div>
      )}
    </section>
  );
}
