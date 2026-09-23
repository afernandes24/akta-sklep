import { plural } from '@/lib/format';
import type { CaseRating } from '@/lib/types';

export function RatingBadge({ rating, className = '' }: { rating?: CaseRating | null; className?: string }) {
  if (!rating || rating.count === 0) return null;
  const avg = rating.avg.toFixed(1).replace('.', ',');
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm text-paper-200 ${className}`} aria-label={`Ocena klientów: ${avg} na 5, ${rating.count} opinii`}>
      <span aria-hidden className="text-amber-300">★</span>
      <strong className="font-semibold text-paper-50">{avg}</strong>
      <span className="text-muted">
        ({rating.count} {plural(rating.count, 'opinia', 'opinie', 'opinii')})
      </span>
    </span>
  );
}
