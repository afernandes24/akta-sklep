'use client';

import Link from 'next/link';
import { useActionState, useState, useTransition, useEffect } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { CaseCover } from '@/components/case/CaseCover';
import { Notice } from '@/components/ui/PageHeader';
import { formatPrice } from '@/lib/format';
import { DIGITAL_CONSENT_TEXT } from '@/lib/legal/documents';
import { type CouponRule, priceCart, VOLUME_TIERS } from '@/lib/pricing';
import { cartKey } from '@/lib/types';
import { type CheckoutState, checkCoupon, startCheckout, freshCartPrices } from './actions';

interface Props {
  loggedIn: boolean;
  email: string | null;
  paymentsReady: boolean;
  testMode: boolean;
  providerLabel: string;
}

export function CartView({ loggedIn, email, paymentsReady, testMode, providerLabel }: Props) {
  const { items, ready, remove, sync } = useCart();
  const [synced, setSynced] = useState(false);

  // Ceny z serwera — koszyk w przeglądarce mógł zapamiętać starą cenę
  useEffect(() => {
    if (!ready || synced) return;
    setSynced(true);
    if (items.length) freshCartPrices(items.map((i) => cartKey(i))).then(sync).catch(() => undefined);
  }, [ready, synced, items, sync]);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const [coupon, setCoupon] = useState<CouponRule | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checking, startChecking] = useTransition();

  const price = priceCart(
    items.map((i) => i.priceGrosze),
    coupon,
  );
  const nextTier = [...VOLUME_TIERS].reverse().find((t) => t.minItems > items.length);

  const applyCode = () =>
    startChecking(async () => {
      const res = await checkCoupon(codeInput);
      if (res.coupon) {
        setCoupon(res.coupon);
        setCodeError(null);
      } else {
        setCoupon(null);
        setCodeError(res.error ?? 'Nieprawidłowy kod.');
      }
    });

  if (!ready) return <div className="card h-48 animate-pulse" />;

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center p-10 text-center">
        <span className="stamp">Pusta teczka</span>
        <p className="mt-6 text-lg text-paper-200">Twój koszyk jest pusty.</p>
        <Link href="/sprawy" className="btn-primary mt-6">
          Wybierz sprawę
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <ul className="card min-w-0 divide-y divide-ink-800">
        {items.map((item) => (
          <li key={cartKey(item)} className="flex items-center gap-4 p-5">
            <CaseCover caseNumber={item.caseNumber} title={item.title} size="xs" className="w-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="eyebrow">Akta #{item.caseNumber}</p>
              <Link href={`/sprawy/${item.slug}`} className="block truncate font-serif text-lg text-paper-50 hover:text-brass-300">
                {item.title}
              </Link>
              <p className="text-xs text-muted">{item.format === 'online' ? 'Wersja online — akta w przeglądarce' : 'PDF do pobrania i druku'}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-paper-50">{formatPrice(item.priceGrosze)}</p>
              <button type="button" onClick={() => remove(cartKey(item))} className="mt-1 text-xs text-muted underline-offset-2 hover:text-stamp-500 hover:underline">
                Usuń
              </button>
            </div>
          </li>
        ))}
      </ul>

      <aside className="card h-fit p-6 lg:sticky lg:top-24">
        <h2 className="font-serif text-2xl font-semibold">Podsumowanie</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-paper-200">
            <dt>Produkty ({items.length})</dt>
            <dd>{formatPrice(price.subtotal)}</dd>
          </div>
          {price.discount > 0 && (
            <div className="flex justify-between text-emerald-300">
              <dt>{price.label}</dt>
              <dd>−{formatPrice(price.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-paper-200">
            <dt>Dostawa</dt>
            <dd>0,00 zł · pobranie</dd>
          </div>
          <div className="flex justify-between border-t border-ink-700 pt-3 text-lg font-semibold text-paper-50">
            <dt>Razem</dt>
            <dd>{formatPrice(price.total)}</dd>
          </div>
        </dl>
        {nextTier && (
          <p className="mt-3 rounded-md border border-brass-500/30 bg-brass-500/10 px-3 py-2 text-xs text-brass-300">
            Dodaj jeszcze {nextTier.minItems - items.length} {nextTier.minItems - items.length === 1 ? 'sprawę' : 'sprawy'}, a zapłacisz o {nextTier.percent}%
            mniej.{' '}
            <Link href="/sprawy" className="underline underline-offset-2">
              Wybierz sprawę
            </Link>
          </p>
        )}

        <div className="mt-4">
          {coupon ? (
            <div className="flex items-center justify-between rounded-md border border-ink-700 px-3 py-2 text-sm">
              <span>
                Kod: <span className="font-mono font-bold text-brass-300">{coupon.code}</span>
              </span>
              <button
                type="button"
                className="text-xs text-muted underline hover:text-stamp-500"
                onClick={() => {
                  setCoupon(null);
                  setCodeInput('');
                }}
              >
                Usuń kod
              </button>
            </div>
          ) : (
            <details className="text-sm" open={Boolean(codeError)}>
              <summary className="cursor-pointer text-paper-200 hover:text-brass-300">Masz kod rabatowy?</summary>
              <div className="mt-2 flex gap-2">
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCode())}
                  className="input py-2 font-mono uppercase"
                  placeholder="KOD"
                  aria-label="Kod rabatowy"
                  maxLength={32}
                />
                <button type="button" onClick={applyCode} disabled={checking || !codeInput.trim()} className="btn-secondary py-2">
                  {checking ? '…' : 'Użyj'}
                </button>
              </div>
            </details>
          )}
          {codeError && !coupon && <p className="mt-2 text-xs text-stamp-500">{codeError}</p>}
          {coupon && price.couponIgnoredReason && <p className="mt-2 text-xs text-muted">{price.couponIgnoredReason}</p>}
        </div>
        <p className="mt-2 text-xs text-muted">Cenę sprawdzamy jeszcze raz przed płatnością — jeśli się zmieni, zobaczysz komunikat, zanim zapłacisz.</p>

        {
          <form action={action} className="mt-6 space-y-4">
            {items.map((i) => (
              <input key={cartKey(i)} type="hidden" name="caseId" value={cartKey(i)} />
            ))}
            {coupon && price.source === 'coupon' && <input type="hidden" name="coupon" value={coupon.code} />}
            <input type="hidden" name="expectedTotal" value={price.total} />
            {state.error && <Notice tone="error">{state.error}</Notice>}
            {!paymentsReady && <Notice tone="warning">Płatności nie są jeszcze skonfigurowane.</Notice>}
            {testMode && <Notice tone="warning">Tryb testowy — żadne pieniądze nie zostaną pobrane.</Notice>}
            {loggedIn ? (
              <p className="text-xs text-muted">Zamawiasz jako: {email}</p>
            ) : (
              <div>
                <label htmlFor="checkout-email" className="label">
                  Twój e-mail
                </label>
                <input
                  id="checkout-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="np. jan@gmail.com"
                  className="input"
                  maxLength={200}
                />
                <p className="mt-1.5 text-xs text-muted">
                  Bez zakładania konta. Po płatności od razu pobierzesz pliki, a link do nich wyślemy też na ten adres.{' '}
                  <Link href="/logowanie?next=/koszyk" className="text-brass-300 underline underline-offset-2">
                    Masz konto? Zaloguj się
                  </Link>
                </p>
                {items.some((i) => i.format === 'online') && (
                  <p className="mt-1.5 text-xs text-brass-300">
                    Wersja online działa na darmowym koncie — po płatności założysz je jednym kliknięciem, a zakup sam się do niego przypisze.
                  </p>
                )}
              </div>
            )}
            <label className="flex gap-3 text-sm leading-relaxed text-paper-200">
              <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 shrink-0 accent-brass-400" />
              <span>
                Akceptuję{' '}
                <Link href="/regulamin" target="_blank" className="text-brass-300 underline">
                  regulamin
                </Link>{' '}
                sklepu.
              </span>
            </label>
            <label className="flex gap-3 text-sm leading-relaxed text-paper-200">
              <input type="checkbox" name="digital_consent" required className="mt-1 h-4 w-4 shrink-0 accent-brass-400" />
              <span>{DIGITAL_CONSENT_TEXT}</span>
            </label>
            <button type="submit" className="btn-primary w-full text-base" disabled={pending || !paymentsReady}>
              {pending ? 'Przekierowuję do płatności…' : `Zamawiam i płacę ${formatPrice(price.total)}`}
            </button>
            <p className="text-center text-xs text-muted">Płatność obsługuje: {providerLabel}</p>
          </form>
        }
      </aside>
    </div>
  );
}
