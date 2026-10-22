import Link from 'next/link';
import { AddToCartButtons } from '../cart/AddToCartButtons';
import { CaseCover } from './CaseCover';
import { RatingBadge } from './RatingBadge';
import { formatPrice } from '@/lib/format';
import { levelName } from '@/lib/tags';
import type { CaseRating, CaseRecord } from '@/lib/types';

/** Mała karta sprawy (bestsellery): okładka, tytuł, poziom, czas, cena, przycisk. */
export function CaseCardMini({ c, rank, rating }: { c: CaseRecord; rank?: number; rating?: CaseRating | null }) {
  const href = `/sprawy/${c.slug}`;
  const time = c.play_time_minutes >= 120 ? `${(c.play_time_minutes / 60).toFixed(1).replace('.0', '').replace('.', ',')} h` : `${c.play_time_minutes} min`;
  return (
    <article className="card group relative flex gap-4 p-4 transition hover:border-brass-500/50">
      {rank && (
        <span className="absolute -left-2 -top-2 z-10 rounded-full bg-brass-400 px-2 py-0.5 font-mono text-[11px] font-bold text-ink-950 shadow">#{rank}</span>
      )}
      <Link href={href} className="block w-24 shrink-0 sm:w-28" tabIndex={-1} aria-hidden>
        <CaseCover caseNumber={c.case_number} title={c.title} coverPath={c.cover_path} className="transition duration-300 group-hover:-translate-y-0.5" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="eyebrow">Akta #{c.case_number}</p>
        <h3 className="mt-0.5 text-lg font-bold leading-tight">
          <Link href={href} className="hover:text-brass-300">
            {c.title}
          </Link>
        </h3>
        <RatingBadge rating={rating} className="mt-1 text-xs" />
        <p className="mt-1 text-xs text-muted">
          {c.difficulty}/5 · {levelName(c.difficulty)} · {time}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="font-serif text-xl font-bold text-paper-50">{formatPrice(c.price_grosze)}</span>
        </div>
        <AddToCartButtons
          variant="compact"
          className="mt-2 min-h-0 py-2 text-sm"
          item={{ id: c.id, slug: c.slug, title: c.title, caseNumber: c.case_number, priceGrosze: c.price_grosze }}
        />
      </div>
    </article>
  );
}
