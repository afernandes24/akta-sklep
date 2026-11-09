'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { GiftFields } from '@/components/cart/GiftFields';
import { EmailTypoHint } from '@/components/ui/EmailTypoHint';
import { Notice } from '@/components/ui/PageHeader';
import { formatPrice } from '@/lib/format';
import { type GiftCardState, startGiftCardCheckout } from './actions';

export function GiftCardForm({ amounts, email, paymentsReady }: { amounts: readonly number[]; email: string | null; paymentsReady: boolean }) {
  const [state, action, pending] = useActionState<GiftCardState, FormData>(startGiftCardCheckout, {});
  const [amount, setAmount] = useState(amounts[1] ?? amounts[0]);
  const [forSelf, setForSelf] = useState(false);
  return (
    <form action={action} className="card space-y-5 p-6 sm:p-8">
      <fieldset>
        <legend className="label">Wartość karty</legend>
        <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {amounts.map((a) => (
            <label
              key={a}
              className={`cursor-pointer rounded-md border px-3 py-3 text-center font-serif text-xl font-bold transition ${
                amount === a ? 'border-brass-400 bg-brass-400 text-ink-950' : 'border-ink-700 text-paper-100 hover:border-brass-500/60'
              }`}
            >
              <input type="radio" name="amount" value={a} checked={amount === a} onChange={() => setAmount(a)} className="sr-only" />
              {formatPrice(a).replace(',00', '')}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="label">Dla kogo</legend>
        <label className="flex items-center gap-3 text-sm text-paper-100">
          <input type="radio" name="recipient" value="other" checked={!forSelf} onChange={() => setForSelf(false)} className="accent-brass-400" />
          Wyślij mailem obdarowanemu (w wybranym dniu)
        </label>
        <label className="flex items-center gap-3 text-sm text-paper-100">
          <input type="radio" name="recipient" value="self" checked={forSelf} onChange={() => setForSelf(true)} className="accent-brass-400" />
          Wyślij do mnie — wręczę sam(a)
        </label>
      </fieldset>
      {!forSelf && <GiftFields idPrefix="card-gift" />}

      {email ? (
        <p className="text-xs text-muted">Kupujesz jako: {email}</p>
      ) : (
        <div>
          <label htmlFor="card-email" className="label">
            Twój e-mail (potwierdzenie zakupu)
          </label>
          <input id="card-email" name="email" type="email" required autoComplete="email" maxLength={200} className="input" placeholder="np. jan@gmail.com" />
          <EmailTypoHint inputId="card-email" />
        </div>
      )}

      <label className="flex gap-3 text-sm leading-relaxed text-paper-200">
        <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 shrink-0 accent-brass-400" />
        <span>
          Akceptuję{' '}
          <Link href="/regulamin#rabaty" target="_blank" className="text-brass-300 underline">
            regulamin
          </Link>{' '}
          (karta ważna 12 miesięcy, można wykorzystać w kilku zakupach; niewykorzystaną kartę można zwrócić w ciągu 14 dni).
        </span>
      </label>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <button className="btn-primary w-full text-base" disabled={pending || !paymentsReady}>
        {pending ? 'Przekierowuję do płatności…' : `Kupuję kartę za ${formatPrice(amount)}`}
      </button>
    </form>
  );
}
