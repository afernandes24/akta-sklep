import Link from 'next/link';
import { JsonLd } from '@/components/ui/JsonLd';
import { siteConfig } from '@/lib/config';

/** Wspólny układ poradników: okruszki (z JSON-LD), nagłówek z H1, treść i CTA na końcu. */
export function GuideLayout({
  path,
  crumb,
  eyebrow,
  title,
  intro,
  children,
  extraJsonLd,
}: {
  path: string;
  crumb: string;
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
  extraJsonLd?: Record<string, unknown>;
}) {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Strona główna', item: `${siteConfig.url}/` },
            { '@type': 'ListItem', position: 2, name: crumb, item: `${siteConfig.url}${path}` },
          ],
        }}
      />
      {extraJsonLd && <JsonLd data={extraJsonLd} />}
      <div className="container-page pt-8">
        <nav aria-label="Okruszki" className="text-sm text-muted">
          <Link href="/" className="hover:text-brass-300">
            Strona główna
          </Link>{' '}
          / <span className="text-paper-200">{crumb}</span>
        </nav>
      </div>
      <header className="container-page max-w-3xl pb-6 pt-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">{title}</h1>
        <div className="mt-5 text-lg leading-relaxed text-paper-200">{intro}</div>
      </header>
      <article className="guide container-page max-w-3xl space-y-12 text-paper-200">{children}</article>
      <section className="container-page mt-16 max-w-3xl">
        <div className="paper rounded-xl px-6 py-10 text-center sm:px-10">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-600">Akta czekają</p>
          <p className="mx-auto mt-3 max-w-xl font-serif text-2xl font-bold text-ink-900 sm:text-3xl">Wybierz sprawę i zacznij śledztwo jeszcze dziś</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/sprawy" className="btn bg-ink-900 px-7 text-paper-50 hover:bg-ink-700">
              Zobacz wszystkie sprawy
            </Link>
            <Link href="/darmowa-sprawa" className="btn border border-ink-900/30 px-7 text-ink-900 hover:border-ink-900">
              Zagraj za darmo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/** Sekcja poradnika z nagłówkiem H2. */
export function GuideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-3xl font-bold">{title}</h2>
      <div className="mt-4 space-y-4 leading-relaxed">{children}</div>
    </section>
  );
}

export const guideLink = 'text-brass-300 underline-offset-4 hover:underline';
