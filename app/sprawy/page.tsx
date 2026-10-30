import type { Metadata } from 'next';
import Link from 'next/link';
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
  title: 'Gry kryminalne i detektywistyczne PDF',
  description: 'Sprawy kryminalne do rozwiązania w domu – akta sprawy w PDF do druku lub online. Lublin, Hel, Podhale, Kraków. Od 19,99 zł, 1–6 graczy.',
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
      <PageHeader eyebrow="Archiwum" title="Gry kryminalne i detektywistyczne do druku">
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
            <section className="mx-auto mt-20 max-w-3xl text-paper-200">
              <h2 className="text-3xl font-bold">Gra detektywistyczna do druku – jak to działa?</h2>
              <div className="mt-5 space-y-4 leading-relaxed">
                <p>
                  Każda sprawa to gra detektywistyczna do druku w formie prawdziwych akt: raporty policyjne, protokoły przesłuchań, zdjęcia z miejsca
                  zdarzenia, wiadomości z telefonów i dowody do samodzielnej analizy. Po zakupie od razu pobierasz pliki PDF, drukujesz je na zwykłej
                  drukarce A4 i siadasz do śledztwa. To trochę jak planszowa gra detektywistyczna, ale bez pudełka – od razu w PDF.
                </p>
                <p>
                  Gra kryminalna z aktami sprawy prowadzi cię przez kilka celów śledztwa. Na każdym etapie odpowiadasz na pytanie prowadzącego
                  komisarza, a gdy utkniesz, sięgasz po wskazówki ułożone od najsłabszej do najmocniejszej. Odpowiedzi z uzasadnieniem sprawdzisz
                  w osobnym pliku, więc wiesz, czy twoja dedukcja trzyma się dowodów.
                </p>
                <p>
                  Sprawy są dla dorosłych (16+) i działają w różnych składach: jako gra dla dwojga na wieczór we dwoje, ze znajomymi przy jednym
                  stole albo w pojedynkę. Każda sprawa kryminalna do rozwiązania ma jedno logiczne rozwiązanie. Część spraw kupisz też w wersji
                  online – te same akta w przeglądarce, bez drukowania.
                </p>
                <p>
                  Nie wiesz, od czego zacząć? Pobierz{' '}
                  <Link href="/darmowa-sprawa" className="text-brass-300 underline-offset-4 hover:underline">
                    darmową sprawę
                  </Link>{' '}
                  albo zajrzyj do{' '}
                  <Link href="/faq" className="text-brass-300 underline-offset-4 hover:underline">
                    najczęstszych pytań
                  </Link>
                  .
                </p>
              </div>
            </section>
            <FreeCaseCta source="katalog" />
          </>
        )}
      </section>
    </>
  );
}
