import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCartButtons } from '@/components/cart/AddToCartButtons';
import { CaseCover } from '@/components/case/CaseCover';
import { CaseBadges } from '@/components/case/CaseBadges';
import { CaseStats } from '@/components/case/CaseStats';
import { RatingBadge } from '@/components/case/RatingBadge';
import { ReviewsSection } from '@/components/case/ReviewsSection';
import { DocumentExcerpt } from '@/components/case/DocumentExcerpt';
import { StickyBuyBar } from '@/components/case/StickyBuyBar';
import { TrackViewItem } from '@/components/consent/TrackEvents';
import { JsonLd } from '@/components/ui/JsonLd';
import { getCaseImages, getPublishedCaseBySlug, getPublishedCases } from '@/lib/cases';
import { publicStorageUrl, siteConfig } from '@/lib/config';
import { formatPrice } from '@/lib/format';
import { getApprovedReviews, getCaseRatings } from '@/lib/reviews';

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const cases = await getPublishedCases();
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const c = await getPublishedCaseBySlug(slug);
  if (!c) return { title: 'Nie znaleziono sprawy' };
  // Domyślny tytuł (gdy w bazie brak seo_title) — max ok. 60 znaków
  const long = `${c.title} – gra detektywistyczna do druku | AKTA #${c.case_number}`;
  const title = c.seo_title || (long.length <= 60 ? long : `${c.title} – gra detektywistyczna PDF | AKTA #${c.case_number}`);
  const description = c.seo_description || c.tagline;
  const cover = publicStorageUrl('covers', c.cover_path);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/sprawy/${c.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `/sprawy/${c.slug}`,
      images: [cover ? { url: cover, alt: c.title } : { url: '/og.png', width: 1200, height: 630, alt: c.title }],
    },
  };
}

export default async function CasePage({ params }: Params) {
  const { slug } = await params;
  const c = await getPublishedCaseBySlug(slug);
  if (!c) notFound();

  const [images, reviews, ratings] = await Promise.all([getCaseImages(c.id), getApprovedReviews(c.id), getCaseRatings()]);
  const rating = ratings[c.id] ?? null;
  const cartItem = { id: c.id, slug: c.slug, title: c.title, caseNumber: c.case_number, priceGrosze: c.price_grosze, format: 'pdf' as const };
  const online = c.online_enabled ? { priceGrosze: c.online_price_grosze ?? c.price_grosze } : null;
  const fromPrice = online ? Math.min(online.priceGrosze, c.price_grosze) : c.price_grosze;
  const url = `${siteConfig.url}/sprawy/${c.slug}`;
  const coverUrl = publicStorageUrl('covers', c.cover_path);

  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `AKTA #${c.case_number} — ${c.title}`,
            description: c.seo_description || c.tagline,
            sku: `AKTA-${c.case_number}`,
            category: 'Gra detektywistyczna do druku (PDF)',
            brand: { '@type': 'Brand', name: siteConfig.name },
            image: coverUrl ?? `${siteConfig.url}/og.png`,
            url,
            offers: online
              ? {
                  '@type': 'AggregateOffer',
                  lowPrice: (fromPrice / 100).toFixed(2),
                  highPrice: (Math.max(online.priceGrosze, c.price_grosze) / 100).toFixed(2),
                  offerCount: 2,
                  priceCurrency: 'PLN',
                  availability: 'https://schema.org/InStock',
                  url,
                }
              : {
                  '@type': 'Offer',
                  price: (c.price_grosze / 100).toFixed(2),
                  priceCurrency: 'PLN',
                  availability: 'https://schema.org/InStock',
                  url,
                },
            ...(rating && rating.count > 0
              ? {
                  aggregateRating: { '@type': 'AggregateRating', ratingValue: rating.avg, reviewCount: rating.count, bestRating: 5, worstRating: 1 },
                  review: reviews.slice(0, 5).map((r) => ({
                    '@type': 'Review',
                    reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
                    author: { '@type': 'Person', name: r.author_name },
                    datePublished: r.created_at.slice(0, 10),
                    reviewBody: r.body,
                  })),
                }
              : {}),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Strona główna', item: siteConfig.url },
              { '@type': 'ListItem', position: 2, name: 'Sprawy', item: `${siteConfig.url}/sprawy` },
              { '@type': 'ListItem', position: 3, name: c.title, item: url },
            ],
          },
        ]}
      />

      <div className="container-page pt-6">
        <nav aria-label="Okruszki" className="text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-brass-300">
                Strona główna
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/sprawy" className="hover:text-brass-300">
                Sprawy
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-paper-200" aria-current="page">
              {c.title}
            </li>
          </ol>
        </nav>
      </div>

      {/* NAGŁÓWEK PRODUKTU */}
      <section className="container-page grid gap-10 pb-16 pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <div className="mx-auto w-full max-w-md lg:sticky lg:top-24 lg:self-start">
          <CaseCover caseNumber={c.case_number} title={c.title} coverPath={c.cover_path} size="lg" priority />
        </div>
        <div>
          <p className="eyebrow">Akta #{c.case_number}</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">
            {c.title}
            <span className="mt-2 block font-sans text-lg font-normal text-muted">– sprawa kryminalna do druku</span>
          </h1>
          {rating && (
            <a href="#opinie" className="mt-3 inline-block hover:opacity-80">
              <RatingBadge rating={rating} />
            </a>
          )}
          <p className="mt-4 text-lg leading-relaxed text-paper-200">{c.tagline}</p>
          <CaseBadges c={c} className="mt-4" />

          <div className="mt-8">
            <CaseStats layout="grid" difficulty={c.difficulty} minutes={c.play_time_minutes} suspects={c.suspect_count} pages={c.page_count} />
          </div>

          <div id="kup" className="card mt-8 p-6">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-serif text-4xl font-bold text-paper-50">
                {online && <span className="mr-2 text-lg font-normal text-muted">od</span>}
                {formatPrice(fromPrice)}
              </p>
              <p className="text-sm text-muted">{online ? 'PDF do druku lub online' : 'produkt cyfrowy · PDF'}</p>
            </div>
            <AddToCartButtons item={cartItem} online={online} className="mt-5" />
            <ul className="mt-5 space-y-2 text-sm text-paper-200">
              <li>✓ Dostęp do plików od razu po potwierdzeniu płatności</li>
              <li>✓ Pliki zawsze dostępne na koncie — możesz pobrać je ponownie</li>
              <li>✓ Wskazówki i odpowiedzi w osobnych, wyraźnie oznaczonych plikach</li>
              {(c.recordings_count ?? 0) > 0 && <li>🎧 W zestawie nagrania z przesłuchań — odsłuchasz je na koncie (w obu wersjach)</li>}
            </ul>
            <p className="mt-4 text-xs text-muted">
              🤖 Postacie są fikcyjne. Ich portrety{(c.recordings_count ?? 0) > 0 ? ' i głosy w nagraniach' : ''} wygenerowano z użyciem sztucznej inteligencji.
            </p>
          </div>

          {/* OPIS */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold">Opis sprawy</h2>
            <div className="prose-akta mt-4 text-lg">
              {c.description.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {c.highlights.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold">Czego możesz się spodziewać</h2>
              <ul className="mt-5 space-y-3">
                {c.highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-paper-200">
                    <span aria-hidden className="mt-1 text-brass-400">
                      ◆
                    </span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.contents.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold">Co otrzymasz</h2>
              <ul className="mt-5 divide-y divide-ink-800 overflow-hidden rounded-lg border border-ink-700">
                {c.contents.map((line) => {
                  const [name, ...rest] = line.split(' — ');
                  const isSolution = /rozwi[aą]zanie|odpowiedz/i.test(name);
                  return (
                    <li key={line} className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 ${isSolution ? 'bg-stamp-600/10' : 'bg-ink-900'}`}>
                      <span className={`font-mono text-sm ${isSolution ? 'text-stamp-500' : 'text-brass-300'}`}>{name}</span>
                      {rest.length > 0 && <span className="text-sm text-muted">{rest.join(' — ')}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* PRZYKŁADOWE MATERIAŁY */}
      {(c.excerpts.length > 0 || images.length > 0) && (
        <section className="border-y border-ink-800 bg-ink-900/60 py-20">
          <div className="container-page">
            <div className="max-w-2xl">
              <p className="eyebrow">Zajrzyj do teczki</p>
              <h2 className="mt-2 text-4xl font-bold">Przykładowe materiały</h2>
              <p className="mt-4 text-paper-200">Kilka fragmentów z akt. Spokojnie — nie zdradzają, kto jest winny.</p>
            </div>

            {images.length > 0 && (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {images.map((img) => (
                  <figure key={img.id} className="overflow-hidden rounded-lg border border-ink-700 bg-ink-950">
                    <Image
                      src={publicStorageUrl('previews', img.path)!}
                      alt={img.caption || `Przykładowa strona akt — ${c.title}`}
                      width={1240}
                      height={1754}
                      sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                      loading="lazy"
                      className="h-auto w-full"
                    />
                    {img.caption && <figcaption className="px-4 py-3 text-sm text-muted">{img.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            )}

            {c.excerpts.length > 0 && (
              <div className="mt-12 grid items-start gap-10 md:grid-cols-2 lg:grid-cols-3">
                {c.excerpts.map((e, i) => (
                  <DocumentExcerpt key={i} excerpt={e} index={i} caseNumber={c.case_number} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <ReviewsSection reviews={reviews} rating={rating} />

      {/* JAK ZAGRAĆ */}
      <section className="container-page py-20">
        <h2 className="text-3xl font-bold">Jak zagrać?</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Pobierz', 'Po zakupie pliki PDF znajdziesz w zakładce „Moje sprawy”.'],
            ['Wydrukuj', 'Wydrukuj akta sprawy i trzymaj strony po kolei. Wskazówek i odpowiedzi nie drukuj od razu.'],
            ['Rozwiązuj cele', 'Zacznij od instrukcji i idź cel po celu — nie czytaj do przodu. Utknąłeś? Zajrzyj do wskazówek.'],
            ['Wskaż winnego', 'Po każdym celu sprawdź odpowiedź. Kto zabił — dowiesz się na końcu pliku z odpowiedziami.'],
          ].map(([title, text], i) => (
            <li key={title} className="card p-6">
              <span className="font-mono text-sm text-brass-400">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 font-serif text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-muted">
          Masz pytania? Zajrzyj do{' '}
          <Link href="/faq" className="text-brass-300 underline-offset-4 hover:underline">
            FAQ
          </Link>
          .
        </p>
      </section>

      <StickyBuyBar item={cartItem} priceLabel={formatPrice(c.price_grosze)} />
      <TrackViewItem id={c.id} title={c.title} priceGrosze={c.price_grosze} />
    </>
  );
}
