import Link from 'next/link';
import { CaseCard, ComingSoonCard } from '@/components/case/CaseCard';
import { CaseCardMini } from '@/components/case/CaseCardMini';
import { HeroVisual } from '@/components/home/HeroVisual';
import { HowItWorks } from '@/components/home/HowItWorks';
import { InvestigationFlow } from '@/components/home/InvestigationFlow';
import { WhatsInside } from '@/components/home/WhatsInside';
import { JsonLd } from '@/components/ui/JsonLd';
import { getPublishedCases } from '@/lib/cases';
import { getCaseRatings } from '@/lib/reviews';
import { BundlesSection } from '@/components/cart/BundlesSection';
import { FreeCaseCta } from '@/components/newsletter/FreeCaseCta';
import { siteConfig } from '@/lib/config';
import { PromoBanner } from '@/components/home/PromoBanner';
import { getBestsellers, getHomePromo, HOME_PROMO } from '@/lib/promo';

export const revalidate = 60;

export default async function HomePage() {
  const [cases, ratings] = await Promise.all([getPublishedCases(), getCaseRatings()]);
  const first = cases[0];
  const [promo, bestsellers] = await Promise.all([getHomePromo(cases).catch(() => null), getBestsellers(cases).catch(() => cases.slice(0, 3))]);
  const bestIds = new Set(bestsellers.map((c) => c.id));
  const others = cases.filter((c) => !bestIds.has(c.id)).slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteConfig.name,
          url: siteConfig.url,
          logo: `${siteConfig.url}/icon.svg`,
          ...(siteConfig.contactEmail ? { email: siteConfig.contactEmail } : {}),
        }}
      />

      {/* PROMOCJA (znika sama, gdy kod wygaśnie) */}
      {promo && (
        <PromoBanner
          eyebrow={HOME_PROMO.eyebrow}
          code={promo.code}
          percentOff={promo.percentOff}
          amountOffGrosze={promo.amountOffGrosze}
          validUntil={promo.validUntil}
          c={promo.case}
        />
      )}

      {/* HERO */}
      <section className="container-page grid items-center gap-12 pb-16 pt-12 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
        <div>
          <p className="eyebrow">Gry detektywistyczne do druku · PDF</p>
          <h1 className="mt-4 text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
            Twoja sprawa.
            <br />
            Twoje śledztwo.
            <br />
            <span className="text-brass-400">Twoja dedukcja.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper-200 sm:text-xl">
            Wydrukuj akta, przeanalizuj dowody, przesłuchaj podejrzanych i odkryj prawdę.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/sprawy" className="btn-primary px-7 text-base">
              Zobacz sprawy
            </Link>
            <Link href={first ? `/sprawy/${first.slug}` : '/sprawy'} className="btn-secondary px-7 text-base">
              Rozwiąż pierwszą sprawę
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <li>✓ Natychmiastowe pobranie</li>
            <li>✓ Drukujesz w domu na A4</li>
            <li>✓ Jedno logiczne rozwiązanie</li>
          </ul>
        </div>
        <HeroVisual />
      </section>

      {/* BESTSELLERY */}
      {bestsellers.length > 0 && (
        <section className="container-page pb-4 pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Najczęściej wybierane</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Bestsellery</h2>
            </div>
            <Link href="/sprawy" className="text-sm text-brass-300 underline-offset-4 hover:underline">
              Wszystkie sprawy →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {bestsellers.map((c, i) => (
              <CaseCardMini key={c.id} c={c} rank={i + 1} rating={ratings[c.id]} />
            ))}
          </div>
        </section>
      )}

      <HowItWorks />

      {/* SPRAWY */}
      <section className="container-page py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Otwarte śledztwa</p>
            <h2 className="mt-2 text-4xl font-bold sm:text-5xl">Wybierz sprawę</h2>
          </div>
          <Link href="/sprawy" className="text-sm text-brass-300 underline-offset-4 hover:underline">
            Wszystkie sprawy →
          </Link>
        </div>
        {others.length > 0 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((c) => (
              <CaseCard key={c.id} c={c} rating={ratings[c.id]} />
            ))}
            {others.length < 3 && <ComingSoonCard />}
          </div>
        )}
        <div className="mt-16">
          <BundlesSection cases={cases} />
        </div>
      </section>

      <div className="container-page pb-12">
        <FreeCaseCta source="strona-glowna" />
      </div>

      <InvestigationFlow />
      <WhatsInside />

      {/* DLA KOGO */}
      <section className="container-page py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Wieczór we dwoje', 'Zamiast kolejnego serialu — wspólne śledztwo przy kuchennym stole.'],
            ['Spotkanie ze znajomymi', 'Podzielcie się aktami i spierajcie o to, kto kłamie.'],
            ['W pojedynkę', 'Kawa, cisza i sprawa, która nie da ci spokoju.'],
          ].map(([title, text]) => (
            <div key={title} className="card p-6">
              <h3 className="font-serif text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pt-16">
        <div className="paper relative overflow-hidden rounded-xl px-6 py-12 text-center sm:px-12">
          <span className="stamp absolute right-6 top-6 hidden sm:inline-block">Sprawa otwarta</span>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-600">Akta czekają</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl font-bold text-ink-900 sm:text-4xl">
            Policja zamknęła sprawę. Ty jeszcze nie.
          </h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={first ? `/sprawy/${first.slug}` : '/sprawy'} className="btn bg-ink-900 px-7 text-base text-paper-50 hover:bg-ink-700">
              Otwórz pierwsze akta
            </Link>
            <Link href="/faq" className="btn border border-ink-900/30 px-7 text-base text-ink-900 hover:border-ink-900">
              Najczęstsze pytania
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
