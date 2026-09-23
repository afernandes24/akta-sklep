import type { Metadata } from 'next';
import { BundlesSection } from '@/components/cart/BundlesSection';
import { CatalogBrowser } from '@/components/case/CatalogBrowser';
import { FreeCaseCta } from '@/components/newsletter/FreeCaseCta';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageHeader } from '@/components/ui/PageHeader';
import { getPublishedCases } from '@/lib/cases';
import { siteConfig } from '@/lib/config';
import { getCaseRatings } from '@/lib/reviews';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Wszystkie sprawy — gry detektywistyczne PDF do druku',
  description: 'Katalog fabularnych spraw detektywistycznych do pobrania i wydrukowania. Wybierz akta, poznaj podejrzanych i rozwiąż zagadkę morderstwa w domu.',
  alternates: { canonical: '/sprawy' },
};

export default async function CasesPage() {
  const [cases, ratings] = await Promise.all([getPublishedCases(), getCaseRatings()]);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: cases.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${siteConfig.url}/sprawy/${c.slug}`,
            name: `AKTA #${c.case_number} — ${c.title}`,
          })),
        }}
      />
      <PageHeader eyebrow="Archiwum" title="Wszystkie sprawy">
        Każda sprawa to kompletna, zamknięta historia: od pierwszego raportu po końcową dedukcję. Kupujesz raz — pobierasz, kiedy chcesz.
      </PageHeader>
      <section className="container-page">
        {cases.length === 0 ? (
          <p className="text-muted">Brak opublikowanych spraw.</p>
        ) : (
          <>
            <CatalogBrowser cases={cases} ratings={ratings} />
            <div className="mt-20">
              <BundlesSection cases={cases} />
            </div>
            <FreeCaseCta source="katalog" />
          </>
        )}
      </section>
    </>
  );
}
