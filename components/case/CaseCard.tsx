import Link from 'next/link';
import { AddToCartButtons } from '../cart/AddToCartButtons';
import { CaseBadges } from './CaseBadges';
import { CaseCover } from './CaseCover';
import { CaseStats } from './CaseStats';
import { RatingBadge } from './RatingBadge';
import { formatPrice } from '@/lib/format';
import type { CaseRating, CaseRecord } from '@/lib/types';

export function CaseCard({ c, priority, rating }: { c: CaseRecord; priority?: boolean; rating?: CaseRating | null }) {
  const href = `/sprawy/${c.slug}`;
  return (
    <article className="card group flex flex-col overflow-hidden p-5 transition hover:border-brass-500/50">
      <Link href={href} className="block" tabIndex={-1} aria-hidden>
        <CaseCover caseNumber={c.case_number} title={c.title} coverPath={c.cover_path} priority={priority} className="transition duration-300 group-hover:-translate-y-1" />
      </Link>
      <div className="mt-6 flex flex-1 flex-col">
        <p className="eyebrow">Akta #{c.case_number}</p>
        <h3 className="mt-1 text-2xl font-bold">
          <Link href={href} className="hover:text-brass-300">
            {c.title}
          </Link>
        </h3>
        <RatingBadge rating={rating} className="mt-1" />
        <p className="mt-2 text-sm leading-relaxed text-muted">{c.tagline}</p>
        <CaseBadges c={c} className="mt-3" />
        <div className="mt-4">
          <CaseStats difficulty={c.difficulty} minutes={c.play_time_minutes} suspects={c.suspect_count} pages={c.page_count} />
        </div>
        <div className="mt-auto pt-6">
          <p className="mb-3 font-serif text-3xl font-bold text-paper-50">{formatPrice(c.price_grosze)}</p>
          <AddToCartButtons
            variant="compact"
            item={{ id: c.id, slug: c.slug, title: c.title, caseNumber: c.case_number, priceGrosze: c.price_grosze }}
          />
          <Link href={href} className="mt-2 block text-center text-sm text-paper-200 underline-offset-4 hover:text-brass-300 hover:underline">
            Zobacz szczegóły sprawy
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ComingSoonCard() {
  return (
    <div className="card flex flex-col items-center justify-center border-dashed p-8 text-center">
      <div className="flex aspect-[3/4] w-full max-w-[220px] items-center justify-center rounded-lg border border-dashed border-ink-600">
        <span className="font-mono text-sm uppercase tracking-[0.25em] text-muted">Akta w przygotowaniu</span>
      </div>
      <p className="mt-6 font-serif text-xl text-paper-50">Kolejne sprawy wkrótce</p>
      <p className="mt-2 max-w-xs text-sm text-muted">Nowe akta pojawiają się regularnie. Każda sprawa to osobna, zamknięta historia.</p>
    </div>
  );
}
