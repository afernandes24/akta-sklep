import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutoRefresh } from '@/components/account/AutoRefresh';
import { CaseDownloads } from '@/components/account/CaseDownloads';
import { ClearPurchasedFromCart } from '@/components/account/ClearPurchasedFromCart';
import { StatusBadge } from '@/components/account/StatusBadge';
import { TrackPurchase } from '@/components/consent/TrackEvents';
import { Notice } from '@/components/ui/PageHeader';
import { getUser } from '@/lib/auth';
import { formatDate, formatPrice } from '@/lib/format';
import { getOrderByToken, getOrderLibrary } from '@/lib/guest';
import { getProviderById } from '@/lib/payments';
import { claimOrder } from './actions';

export const metadata: Metadata = { title: 'Twoje akta', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Strona zamówienia dla zakupu bez konta — dostęp przez tajny link z e-maila. */
export default async function AccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  let order = await getOrderByToken(token);
  if (!order) notFound();

  // Jeśli webhook jeszcze nie dotarł — sprawdzamy status bezpośrednio u operatora.
  if (order.status === 'pending') {
    const provider = getProviderById(order.provider);
    if (provider?.confirmOnReturn) {
      await provider.confirmOnReturn(order, sp);
      order = (await getOrderByToken(token)) ?? order;
    }
  }

  const user = await getUser();
  const paid = order.status === 'paid';
  const library = paid ? await getOrderLibrary(order) : [];
  const cartKeys = (order.order_items ?? []).filter((i) => i.case_id).map((i) => `${i.case_id}:${i.format ?? 'pdf'}`);
  const claimedByMe = Boolean(user && order.user_id === user.id);
  const back = `/dostep/${token}`;

  return (
    <section className="container-page max-w-4xl py-12 sm:py-16">
      {paid && <ClearPurchasedFromCart caseIds={cartKeys} />}
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
          {paid ? 'Akta są twoje' : order.status === 'pending' ? 'Czekamy na potwierdzenie płatności' : order.status === 'refunded' ? 'Zamówienie zwrócone' : 'Płatność nie powiodła się'}
        </h1>
        <p className="mt-4 text-paper-200">
          Zamówienie nr <span className="font-mono text-paper-50">{order.order_number}</span> · {formatDate(order.created_at)}
        </p>
      </div>

      <div className="mt-10 space-y-4">
        {paid && (
          <Notice>
            Ten link wysłaliśmy też na <strong>{order.email}</strong>. Działa bez logowania — zachowaj go, żeby pobrać pliki ponownie. Nie udostępniaj go innym.
          </Notice>
        )}
        {sp.blad === 'inne-konto' && <Notice tone="error">Ten zakup jest już przypisany do innego konta. Zaloguj się na nie, aby zobaczyć sprawy w „Moje sprawy”.</Notice>}
        {order.status === 'pending' && (
          <Notice>To zwykle trwa kilka sekund. Strona odświeży się sama. Jeśli płatność została pobrana, a status się nie zmienia — napisz do nas.</Notice>
        )}
        {order.status === 'refunded' && (
          <Notice>Pieniądze za to zamówienie zostały zwrócone, a dostęp do materiałów wygasł. Zwrot pojawi się na koncie w ciągu kilku dni roboczych.</Notice>
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
            <CaseDownloads key={entry.caseItem.id} entry={entry} accessToken={token} />
          ))}

          <div className="card p-6">
            {claimedByMe ? (
              <p className="text-sm text-paper-200">
                Ten zakup jest przypisany do twojego konta — znajdziesz go też w{' '}
                <Link href="/konto/sprawy" className="text-brass-300 hover:underline">
                  Moje sprawy
                </Link>
                .
              </p>
            ) : user ? (
              <form action={claimOrder} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <input type="hidden" name="token" value={token} />
                <div>
                  <p className="font-semibold text-paper-50">Dodaj ten zakup do swojego konta</p>
                  <p className="text-sm text-muted">Sprawy pojawią się w „Moje sprawy”, odblokujesz wersję online i opinie. Zalogowano jako {user.email}.</p>
                </div>
                <button className="btn-primary shrink-0">Dodaj do konta</button>
              </form>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-paper-50">Chcesz mieć sprawy zawsze pod ręką?</p>
                  <p className="text-sm text-muted">Załóż darmowe konto — wrócisz tutaj i jednym kliknięciem dodasz do niego ten zakup. Konto odblokowuje też wersję online i opinie.</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/rejestracja?next=${encodeURIComponent(back)}`} className="btn-primary">
                    Załóż konto
                  </Link>
                  <Link href={`/logowanie?next=${encodeURIComponent(back)}`} className="btn-secondary">
                    Zaloguj się
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
