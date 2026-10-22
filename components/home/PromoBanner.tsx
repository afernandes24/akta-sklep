'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { CaseCover } from '@/components/case/CaseCover';
import { formatPrice } from '@/lib/format';

export const PROMO_CODE_KEY = 'akta-kod';

interface Props {
  eyebrow: string;
  code: string;
  percentOff: number | null;
  amountOffGrosze: number | null;
  validUntil: string | null;
  c: { id: string; slug: string; title: string; case_number: string; tagline: string; price_grosze: number; cover_path: string | null };
}

export function PromoBanner({ eyebrow, code, percentOff, amountOffGrosze, validUntil, c }: Props) {
  const { add } = useCart();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const promoPrice = percentOff ? Math.round((c.price_grosze * (100 - percentOff)) / 100) : Math.max(0, c.price_grosze - (amountOffGrosze ?? 0));
  const label = percentOff ? `-${percentOff}%` : `-${formatPrice(amountOffGrosze ?? 0)}`;
  const until = validUntil
    ? new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' }).format(new Date(new Date(validUntil).getTime() - 1000))
    : null;

  const buy = () => {
    try {
      window.sessionStorage.setItem(PROMO_CODE_KEY, code);
    } catch {
      /* bez pamięci kod wpisze się ręcznie */
    }
    add({ id: c.id, slug: c.slug, title: c.title, caseNumber: c.case_number, priceGrosze: c.price_grosze });
    router.push('/koszyk');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* schowek niedostępny */
    }
  };

  return (
    <section className="container-page pt-6 sm:pt-10" aria-label={eyebrow}>
      <div className="relative overflow-hidden rounded-xl border border-orange-500/40 bg-gradient-to-br from-ink-900 via-ink-950 to-[#1d1208] p-5 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="relative grid items-center gap-6 sm:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr]">
          <Link href={`/sprawy/${c.slug}`} className="mx-auto block w-40 sm:w-full" tabIndex={-1} aria-hidden>
            <CaseCover caseNumber={c.case_number} title={c.title} coverPath={c.cover_path} priority className="shadow-2xl transition hover:-translate-y-1" />
          </Link>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-orange-400">
              🎃 {eyebrow}
              {until ? ` · do ${until}` : ''}
            </p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Akta #{c.case_number}: {c.title}
            </h2>
            <p className="mt-2 max-w-xl text-paper-200">{c.tagline}</p>

            <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-2">
              <span className="font-serif text-4xl font-bold text-paper-50">{formatPrice(promoPrice)}</span>
              <span className="pb-1 text-lg text-muted line-through">{formatPrice(c.price_grosze)}</span>
              <span className="mb-1 rounded-full bg-orange-500 px-2.5 py-0.5 font-mono text-xs font-bold text-ink-950">{label}</span>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="button" onClick={buy} className="btn-primary px-7 text-base">
                Kup z kodem {code}
              </button>
              <button
                type="button"
                onClick={copy}
                className="rounded-md border border-dashed border-orange-400/70 px-4 py-2.5 font-mono text-sm font-bold tracking-widest text-orange-300 hover:bg-orange-500/10"
                title="Kopiuj kod"
              >
                {copied ? 'Skopiowano ✓' : code}
              </button>
              <Link href={`/sprawy/${c.slug}`} className="text-sm text-paper-200 underline-offset-4 hover:text-brass-300 hover:underline">
                Zobacz sprawę →
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted">Kod wpisze się sam w koszyku. Działa na całe zamówienie.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
