import { plural } from '@/lib/format';

export function DifficultyStars({ value, showLabel = true }: { value: number; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label={`Trudność: ${value} z 5`}>
      <span aria-hidden className="tracking-[0.1em]">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= value ? 'text-brass-400' : 'text-ink-600'}>
            ★
          </span>
        ))}
      </span>
      {showLabel && <span aria-hidden>Trudność</span>}
    </span>
  );
}

interface StatsProps {
  difficulty: number;
  minutes: number;
  suspects: number;
  pages: number;
  layout?: 'list' | 'grid';
}

export function CaseStats({ difficulty, minutes, suspects, pages, layout = 'list' }: StatsProps) {
  const items = [
    { icon: null, content: <DifficultyStars value={difficulty} /> },
    { icon: '⏱️', content: `${minutes} minut` },
    { icon: '👤', content: `${suspects} ${plural(suspects, 'podejrzany', 'podejrzanych', 'podejrzanych')}` },
    { icon: '📄', content: `${pages} ${plural(pages, 'strona', 'strony', 'stron')}` },
  ];

  if (layout === 'grid') {
    return (
      <dl className="grid grid-cols-2 gap-3">
        {[
          ['Trudność', <DifficultyStars key="d" value={difficulty} showLabel={false} />],
          ['Czas gry', `${minutes} min`],
          ['Podejrzani', String(suspects)],
          ['Materiały', `${pages} ${plural(pages, 'strona', 'strony', 'stron')}`],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-lg border border-ink-700 bg-ink-900 px-4 py-3">
            <dt className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</dt>
            <dd className="mt-1 text-base font-semibold text-paper-50">{value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <ul className="space-y-1.5 text-sm text-paper-200">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2">
          {item.icon && (
            <span aria-hidden className="w-5 text-center">
              {item.icon}
            </span>
          )}
          {item.content}
        </li>
      ))}
    </ul>
  );
}
