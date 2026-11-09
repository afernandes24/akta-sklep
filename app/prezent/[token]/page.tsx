import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutoRefresh } from '@/components/account/AutoRefresh';
import { GiftStatus, getGiftInfo } from '@/components/order/PostPurchase';
import { CopyCode } from '@/components/order/CopyCode';
import { Notice } from '@/components/ui/PageHeader';
import { formatPrice } from '@/lib/format';
import { getOrderByToken } from '@/lib/guest';
import { getProviderById } from '@/lib/payments';

export const metadata: Metadata = { title: 'Karta podarunkowa', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Po zakupie karty podarunkowej — status płatności i (dla „wręczę sam”) kod karty. */
export default async function GiftCardDonePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { token } = await params;
  const sp = await searchParams;
  let order = await getOrderByToken(token);
  if (!order) notFound();
  if (order.status === 'pending') {
    const provider = getProviderById(order.provider);
    if (provider?.confirmOnReturn) {
      await provider.confirmOnReturn(order, sp);
      order = (await getOrderByToken(token)) ?? order;
    }
  }
  const paid = order.status === 'paid';
  const gift = paid ? await getGiftInfo(order.id) : null;
  const forSelf = gift && gift.gift_to_email?.toLowerCase() === order.email.toLowerCase();

  return (
    <section className="container-page max-w-2xl py-12 text-center sm:py-16">
      {order.status === 'pending' && <AutoRefresh />}
      <span className="stamp text-base">{paid ? 'Opłacono' : 'Płatność'}</span>
      <h1 className="mt-6 text-4xl font-bold">{paid ? 'Karta podarunkowa kupiona 🎁' : order.status === 'pending' ? 'Czekamy na potwierdzenie płatności' : 'Płatność nie powiodła się'}</h1>
      <p className="mt-3 text-paper-200">Wartość: {formatPrice(order.total_grosze)}</p>
      <div className="mt-8 space-y-4 text-left">
        {order.status === 'pending' && <Notice>To zwykle trwa kilka sekund. Strona odświeży się sama.</Notice>}
        {(order.status === 'failed' || order.status === 'cancelled') && (
          <Notice tone="error">
            Płatność została anulowana. Nie pobraliśmy żadnych środków. <Link href="/karta-podarunkowa" className="underline">Spróbuj ponownie</Link>
          </Notice>
        )}
        {paid && gift && !forSelf && <GiftStatus gift={gift} />}
        {paid && gift?.gift_card_code && forSelf && (
          <div className="card p-6">
            <p className="eyebrow">Kod karty</p>
            <p className="mt-2 text-sm text-paper-200">Wysłaliśmy go też na {order.email}. Wpisz albo podaruj — działa w koszyku, saldo zostaje na kolejne zakupy.</p>
            <CopyCode code={gift.gift_card_code} />
          </div>
        )}
      </div>
    </section>
  );
}
