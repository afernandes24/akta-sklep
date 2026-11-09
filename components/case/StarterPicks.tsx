import Link from 'next/link';
import { VOLUME_TIERS } from '@/lib/pricing';
import type { CaseRating, CaseRecord } from '@/lib/types';
import { CaseCardMini } from './CaseCardMini';

/** „Od czego zacząć?” — najczęściej kupowane sprawy z przyciskiem do koszyka, na górze katalogu. */
export function StarterPicks({ cases, ratings }: { cases: CaseRecord[]; ratings: Record<string, CaseRating> }) {
  if (cases.length === 0) return null;
  const top = VOLUME_TIERS[0];
  return (
    <section aria-labelledby="od-czego-zaczac" className="mb-14">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Nie wiesz, którą wybrać?</p>
          <h2 id="od-czego-zaczac" className="mt-1 text-2xl font-bold sm:text-3xl">
            Od czego zacząć
          </h2>
        </div>
        <p className="text-sm text-paper-200">
          {top.minItems} sprawy w koszyku = <strong className="text-emerald-300">−{top.percent}%</strong> ·{' '}
          <Link href="#pakiety-sekcja" className="text-brass-300 underline-offset-4 hover:underline">
            zobacz pakiety
          </Link>
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cases.map((c, i) => (
          <CaseCardMini key={c.id} c={c} rank={i + 1} rating={ratings[c.id]} />
        ))}
      </div>
    </section>
  );
}
