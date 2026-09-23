import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageHeader } from '@/components/ui/PageHeader';
import { faq } from '@/lib/content/faq';

export const metadata: Metadata = {
  title: 'FAQ — najczęściej zadawane pytania',
  description: 'Jak pobrać i wydrukować grę detektywistyczną PDF, ile trwa rozgrywka, ile osób może grać i co zrobić, gdy utkniesz w śledztwie.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        }}
      />
      <PageHeader eyebrow="Pytania i odpowiedzi" title="FAQ" />
      <section className="container-page max-w-3xl">
        <div className="divide-y divide-ink-800 rounded-xl border border-ink-700 bg-ink-900/60">
          {faq.map((f) => (
            <details key={f.q} className="group px-5 py-1 sm:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-serif text-lg text-paper-50 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="shrink-0 text-brass-400 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 leading-relaxed text-paper-200">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-paper-200">
          Nie znalazłeś odpowiedzi?{' '}
          <Link href="/kontakt" className="text-brass-300 underline-offset-4 hover:underline">
            Napisz do nas
          </Link>
          .
        </p>
      </section>
    </>
  );
}
