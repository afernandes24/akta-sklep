import Link from 'next/link';
import { CaseCover } from '../case/CaseCover';
import { formatBytes } from '@/lib/format';
import type { LibraryEntry } from '@/lib/library';
import type { Review } from '@/lib/types';
import { ReviewForm } from './ReviewForm';

export function CaseDownloads({ entry, review, defaultAuthor = '' }: { entry: LibraryEntry; review?: Review; defaultAuthor?: string }) {
  const { caseItem, files } = entry;
  const regular = files.filter((f) => !f.is_solution);
  const solution = files.filter((f) => f.is_solution);

  return (
    <article className="card grid gap-6 p-5 sm:grid-cols-[140px_1fr] sm:p-6">
      <Link href={`/sprawy/${caseItem.slug}`} className="mx-auto hidden w-full max-w-[140px] sm:block" tabIndex={-1} aria-hidden>
        <CaseCover caseNumber={caseItem.case_number} title={caseItem.title} coverPath={caseItem.cover_path} />
      </Link>
      <div className="min-w-0">
        <p className="eyebrow">Akta #{caseItem.case_number}</p>
        <h2 className="mt-1 text-2xl font-bold">{caseItem.title}</h2>

        {files.length === 0 ? (
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
                  <a href={`/api/pobierz/${f.id}`} className="btn-secondary shrink-0 py-2 text-xs" download>
                    ↓ Pobierz PDF
                  </a>
                </li>
              ))}
            </ul>

            {solution.length > 0 && (
              <details className="group mt-4 rounded-lg border border-stamp-500/50 bg-stamp-600/10">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
                  <span aria-hidden>🔐</span>
                  <span className="flex-1">
                    <span className="font-semibold text-paper-50">Rozwiązanie sprawy</span>
                    <span className="block text-xs text-muted">Otwórz dopiero po wskazaniu winnego. Kliknij, aby odsłonić.</span>
                  </span>
                  <span aria-hidden className="text-muted transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <ul className="border-t border-stamp-500/30 px-4 py-3">
                  {solution.map((f) => (
                    <li key={f.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-mono text-sm text-stamp-500">{f.file_name}</p>
                      <a href={`/api/pobierz/${f.id}`} className="btn-danger shrink-0 py-2 text-xs" download>
                        Pobierz rozwiązanie
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
        <ReviewForm caseId={caseItem.id} existing={review} defaultAuthor={defaultAuthor} />
      </div>
    </article>
  );
}
