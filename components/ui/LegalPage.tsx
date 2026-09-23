import type { Metadata } from 'next';
import { PageHeader } from './PageHeader';
import type { Block, LegalDoc } from '@/lib/legal/documents';
import { isLegalDataComplete } from '@/lib/legal/seller';
import { PrintButton } from './PrintButton';

const PLACEHOLDER = /(\[DO UZUPEŁNIENIA[^\]]*\])/g;

/** Podświetla pola do uzupełnienia, żeby łatwo je znaleźć przed startem. */
function Text({ children }: { children: string }) {
  const parts = children.split(PLACEHOLDER);
  return (
    <>
      {parts.map((part, i) =>
        PLACEHOLDER.test(part) ? (
          <mark key={i} className="rounded bg-brass-400/25 px-1 text-brass-300">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  if (typeof block === 'string') {
    return (
      <p>
        <Text>{block}</Text>
      </p>
    );
  }
  const ListTag = block.ordered ? 'ol' : 'ul';
  return (
    <ListTag className={`space-y-2 pl-6 ${block.ordered ? 'list-decimal' : 'list-disc'} marker:text-brass-400`}>
      {block.list.map((item, i) => (
        <li key={i} className="pl-1">
          <Text>{item}</Text>
        </li>
      ))}
    </ListTag>
  );
}

export function legalMetadata(doc: LegalDoc): Metadata {
  return { title: doc.title, description: doc.description, alternates: { canonical: `/${doc.slug}` } };
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <PageHeader eyebrow="Dokumenty" title={doc.title} />
      <article className="container-page max-w-3xl">
        {!isLegalDataComplete() && (
          <div className="mb-10 rounded-lg border border-brass-600/60 bg-brass-600/10 px-4 py-3 text-sm text-paper-100 print:hidden">
            <strong>Wersja robocza.</strong> Podświetlone pola uzupełnij w pliku <code className="font-mono">lib/legal/seller.ts</code> przed startem sprzedaży.
          </div>
        )}
        {doc.sections.map((section) => (
          <section key={section.title} id={section.id} className="mb-10 scroll-mt-24">
            <h2 className="mb-4 font-serif text-2xl font-semibold">{section.title}</h2>
            <div className="space-y-3 leading-relaxed text-paper-200">
              {section.blocks.map((b, i) => (
                <BlockView key={i} block={b} />
              ))}
            </div>
          </section>
        ))}
        <PrintButton />
      </article>
    </>
  );
}
