import { statusLabels } from '@/lib/format';

const styles: Record<string, string> = {
  pending: 'border-brass-500/50 text-brass-300',
  paid: 'border-emerald-600/60 text-emerald-300',
  failed: 'border-stamp-500/60 text-stamp-500',
  cancelled: 'border-ink-600 text-muted',
  refunded: 'border-ink-600 text-muted',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider ${styles[status] ?? styles.cancelled}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}
