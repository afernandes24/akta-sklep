import Link from 'next/link';
import { CaseCover } from '../case/CaseCover';
import { fileKind } from '@/lib/files';
import { formatBytes } from '@/lib/format';
import type { LibraryEntry } from '@/lib/library';
import type { Review } from '@/lib/types';
import { RecordingsList } from '../case/RecordingsList';
import { ReviewForm } from './ReviewForm';

export function CaseDownloads({
  entry,
  review,
  defaultAuthor = '',
  accessToken,
}: {
  entry: LibraryEntry;
  review?: Review;
  defaultAuthor?: string;
  /** Zakup bez konta: pliki i nagrania przez link dostępu, bez opinii i bez czytnika online. */
  accessToken?: string;
}) {
  const { caseItem, files } = entry;
  const fileHref = (id: string) => (accessToken ? `/api/dostep/${accessToken}/plik/${id}` : `/api/pobierz/${id}`);
  const kind = (f: (typeof files)[number]) => fileKind(f.file_name, f.is_solution);
  const regular = files.filter((f) => kind(f) === 'material');
  const hints = files.filter((f) => kind(f) === 'hint');
  const solution = files.filter((f) => kind(f) === 'solution');

  return (
    <article className="card grid gap-6 p-5 sm:grid-cols-[140px_1fr] sm:p-6">
      <Link href={`/sprawy/${caseItem.slug}`} className="mx-auto hidden w-full max-w-[140px] sm:block" tabIndex={-1} aria-hidden>
        <CaseCover caseNumber={caseItem.case_number} title={caseItem.title} coverPath={caseItem.cover_path} />
      </Link>
      <div className="min-w-0">
        <p className="eyebrow">Akta #{caseItem.case_number}</p>
        <h2 className="mt-1 text-2xl font-bold">{caseItem.title}</h2>

        {entry.formats.includes('online') && (
          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-brass-500/40 bg-brass-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-paper-50">Wersja online</p>
              <p className="text-xs text-muted">
                {accessToken
                  ? 'Wersja online działa na koncie — przypisz zakup do konta przyciskiem poniżej (to darmowe i zajmie chwilę).'
                  : entry.onlineReady
                    ? 'Czytaj akta w przeglądarce — notatki zapisują się na koncie.'
                    : 'Wersja online jest w przygotowaniu — pojawi się tutaj automatycznie.'}
              </p>
            </div>
            {entry.onlineReady && !accessToken && (
              <Link href={`/online/${caseItem.slug}`} className="btn-primary shrink-0 py-2 text-sm">
                ▶ Otwórz akta online
              </Link>
            )}
          </div>
        )}

        {entry.formats.includes('pdf') && (files.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Materiały są w przygotowaniu — pojawią się tutaj automatycznie, gdy będą gotowe.</p>
        ) : (
          <>
            <ul className="mt-5 divide-y divide-ink-800 rounded-lg border border-ink-700">
              {regular.map((f) => (
                <li key={f.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-brass-300">{f.file_name}</p>
                    <p className="text-xs text-muted">
                      {f.label}
                      {f.size_bytes ? ` · ${formatBytes(f.size_bytes)}` : ''}
                    </p>
                  </div>
                  <a href={fileHref(f.id)} className="btn-secondary shrink-0 py-2 text-xs" download>
                    ↓ Pobierz PDF
                  </a>
                </li>
              ))}
            </ul>

            {hints.length > 0 && (
              <details className="group mt-4 rounded-lg border border-brass-500/40 bg-brass-500/5">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
                  <span aria-hidden>💡</span>
                  <span className="flex-1">
                    <span className="font-semibold text-paper-50">Wskazówki</span>
                    <span className="block text-xs text-muted">Zajrzyj tylko przy celu, na którym utknąłeś.</span>
                  </span>
                  <span aria-hidden className="text-muted transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <ul className="divide-y divide-ink-800 border-t border-brass-500/30">
                  {hints.map((f) => (
                    <li key={f.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="truncate font-mono text-sm text-brass-300">{f.file_name}</p>
                      <a href={fileHref(f.id)} className="btn-secondary shrink-0 py-2 text-xs" download>
                        ↓ Pobierz wskazówki
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {solution.length > 0 && (
              <details className="group mt-4 rounded-lg border border-stamp-500/50 bg-stamp-600/10">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
                  <span aria-hidden>🔐</span>
                  <span className="flex-1">
                    <span className="font-semibold text-paper-50">Odpowiedzi i rozwiązanie</span>
                    <span className="block text-xs text-muted">Sprawdzaj po każdym celu (spis stron na początku). Zabójca — na ostatnich stronach.</span>
                  </span>
                  <span aria-hidden className="text-muted transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <ul className="border-t border-stamp-500/30 px-4 py-3">
                  {solution.map((f) => (
                    <li key={f.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-mono text-sm text-stamp-500">{f.file_name}</p>
                      <a href={fileHref(f.id)} className="btn-danger shrink-0 py-2 text-xs" download>
                        Pobierz
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        ))}
        {entry.recordings.length > 0 && (
          <details className="group mt-4 rounded-lg border border-ink-700">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
              <span aria-hidden>🎧</span>
              <span className="flex-1">
                <span className="font-semibold text-paper-50">Nagrania z przesłuchań ({entry.recordings.length})</span>
                <span className="block text-xs text-muted">Odsłuchaj w przeglądarce — działa też na telefonie.</span>
              </span>
              <span aria-hidden className="text-muted transition group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="border-t border-ink-800 p-3 sm:p-4">
              <RecordingsList items={entry.recordings} compact srcFor={accessToken ? (id) => `/api/dostep/${accessToken}/nagranie/${id}` : undefined} />
            </div>
          </details>
        )}
        {!accessToken && <ReviewForm caseId={caseItem.id} existing={review} defaultAuthor={defaultAuthor} />}
      </div>
    </article>
  );
}
