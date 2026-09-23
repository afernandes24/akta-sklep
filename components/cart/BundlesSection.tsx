import { BUNDLES } from '@/lib/bundles';
import { VOLUME_TIERS } from '@/lib/pricing';
import type { CaseRecord } from '@/lib/types';
import { BundleCard } from './BundleCard';

export function BundlesSection({ cases, heading = true }: { cases: CaseRecord[]; heading?: boolean }) {
  const bundles = BUNDLES.map((b) => ({
    ...b,
    items: b.caseSlugs
      .map((slug) => cases.find((c) => c.slug === slug))
      .filter((c): c is CaseRecord => Boolean(c))
      .map((c) => ({ id: c.id, slug: c.slug, title: c.title, caseNumber: c.case_number, priceGrosze: c.price_grosze })),
  })).filter((b) => b.items.length === b.caseSlugs.length);

  if (bundles.length === 0) return null;
  const tiers = [...VOLUME_TIERS].reverse();

  return (
    <section aria-labelledby="pakiety" className="mb-12">
      {heading && (
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Więcej śledztw, niższa cena</p>
            <h2 id="pakiety" className="mt-2 text-3xl font-bold">
              Pakiety
            </h2>
          </div>
          <p className="text-sm text-paper-200">
            {tiers.map((t, i) => (
              <span key={t.minItems}>
                {i > 0 && ' · '}
                {t.minItems}
                {i === tiers.length - 1 ? '+' : ''} sprawy <strong className="text-emerald-300">−{t.percent}%</strong>
              </span>
            ))}{' '}
            — rabat liczy się sam w koszyku
          </p>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-3">
        {bundles.map((b) => (
          <BundleCard key={b.id} title={b.title} description={b.description} items={b.items} />
        ))}
      </div>
    </section>
  );
}
