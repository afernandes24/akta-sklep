import { formatPlayTime, plural } from '@/lib/format';
import { levelName } from '@/lib/tags';
import { Skulls } from './Skull';

export function DifficultyStars({ value, showLabel = true, stacked = false }: { value: number; showLabel?: boolean; stacked?: boolean }) {
  return (
    <span className={stacked ? 'flex flex-col gap-1' : 'inline-flex items-center gap-2'} title={levelName(value)} aria-label={`Trudność: ${value} z 5 (${levelName(value)})`}>
      <span aria-hidden>
        <Skulls value={value} />
      </span>
      {showLabel && <span aria-hidden>{levelName(value)}</span>}
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
    { icon: '⏱️', content: formatPlayTime(minutes) },
    { icon: '👤', content: `${suspects} ${plural(suspects, 'podejrzany', 'podejrzanych', 'podejrzanych')}` },
    { icon: '📄', content: `${pages} ${plural(pages, 'strona', 'strony', 'stron')}` },
  ];

  if (layout === 'grid') {
    return (
      <dl className="grid grid-cols-2 gap-3">
        {[
          ['Trudność', <DifficultyStars key="d" value={difficulty} stacked />],
          ['Czas gry', formatPlayTime(minutes)],
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
