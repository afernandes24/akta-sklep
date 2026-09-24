import { formatDuration } from '@/lib/format';

export interface RecordingItem {
  id: string;
  title: string;
  person: string | null;
  description: string | null;
  mime_type: string;
  duration_seconds: number | null;
}

export const AI_NOTICE = 'Nagrania wygenerowano z użyciem sztucznej inteligencji — głosy są syntetyczne, a postacie fikcyjne.';

/** Odtwarzacze nagrań z przesłuchań. Plik idzie przez /api/nagranie/[id] (sprawdzenie zakupu). */
export function RecordingsList({ items, compact = false }: { items: RecordingItem[]; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <div>
      <ul className="space-y-3">
        {items.map((r, i) => (
          <li key={r.id} className="rounded-lg border border-ink-700 bg-ink-900/60 p-3 sm:p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 font-semibold text-paper-50">
                <span className="mr-2 font-mono text-xs text-brass-400">N{i + 1}</span>
                {r.title}
              </p>
              {r.duration_seconds ? <span className="shrink-0 font-mono text-xs text-muted">{formatDuration(r.duration_seconds)}</span> : null}
            </div>
            {r.person && <p className="mt-0.5 text-xs text-muted">Przesłuchiwany: {r.person}</p>}
            {!compact && r.description && <p className="mt-1 text-sm text-paper-200">{r.description}</p>}
            {r.mime_type.startsWith('video/') ? (
              <video controls preload="none" playsInline className="mt-3 w-full rounded bg-black" src={`/api/nagranie/${r.id}`} controlsList="nodownload" />
            ) : (
              <audio controls preload="none" className="mt-3 w-full" src={`/api/nagranie/${r.id}`} controlsList="nodownload" />
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">🤖 {AI_NOTICE}</p>
    </div>
  );
}
