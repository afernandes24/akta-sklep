import Link from 'next/link';
import { formatDate, plural } from '@/lib/format';
import type { CaseRating, Review } from '@/lib/types';

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value} na 5`} className="tracking-[0.1em]">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden className={i <= value ? 'text-amber-300' : 'text-ink-600'}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ReviewsSection({ reviews, rating }: { reviews: Review[]; rating?: CaseRating | null }) {
  const count = rating?.count ?? reviews.length;
  return (
    <section id="opinie" className="container-page scroll-mt-24 pb-4 pt-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Opinie detektywów</p>
          <h2 className="mt-2 text-3xl font-bold">Co mówią gracze</h2>
        </div>
        {rating && rating.count > 0 && (
          <p className="text-paper-200">
            <span className="font-serif text-4xl font-bold text-paper-50">{rating.avg.toFixed(1).replace('.', ',')}</span>
            <span className="text-muted"> / 5 · {count} {plural(count, 'opinia', 'opinie', 'opinii')}</span>
          </p>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="card mt-8 p-8 text-center text-paper-200">
          Ta sprawa nie ma jeszcze opinii. Kupiłeś ją? Oceń ją w zakładce{' '}
          <Link href="/konto/sprawy" className="text-brass-300 underline underline-offset-2">
            Moje sprawy
          </Link>
          .
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} />
                <span className="rounded-full border border-emerald-400/30 px-2 py-0.5 text-[11px] text-emerald-300">Zweryfikowany zakup</span>
              </div>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-paper-100">{r.body}</p>
              <p className="mt-4 text-sm text-muted">
                {r.author_name} · {formatDate(r.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted">
        Opinie mogą dodawać wyłącznie osoby, które kupiły daną sprawę — sprawdzamy to automatycznie na podstawie zamówienia przypisanego do konta.
        Publikujemy wszystkie opinie zgodne z regulaminem, także negatywne; nie płacimy za opinie i nie edytujemy ich treści.{' '}
        <Link href="/regulamin#opinie" className="underline underline-offset-2 hover:text-brass-300">
          Zasady publikacji opinii
        </Link>
        .
      </p>
    </section>
  );
}
