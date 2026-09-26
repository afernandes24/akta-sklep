import { tagLabel } from '@/lib/tags';
import type { CaseRecord } from '@/lib/types';

/** Działy, miasto i dodatki sprawy (nagrania, wersja online) — w karcie katalogu i na stronie produktu. */
export function CaseBadges({ c, className = '' }: { c: CaseRecord; className?: string }) {
  const recordings = c.recordings_count ?? 0;
  const items: { key: string; text: string; accent?: boolean }[] = [
    ...(c.city ? [{ key: 'city', text: `📍 ${c.city}` }] : []),
    ...(c.tags ?? []).map((t) => ({ key: t, text: tagLabel(t) })),
    ...(recordings > 0 ? [{ key: 'rec', text: `🎧 Nagrania przesłuchań AI (${recordings})`, accent: true }] : []),
    ...(c.online_enabled ? [{ key: 'online', text: '💻 Wersja online', accent: true }] : []),
  ];
  if (!items.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Dział i dodatki">
      {items.map((i) => (
        <li
          key={i.key}
          className={`rounded-full border px-2 py-0.5 text-[11px] ${i.accent ? 'border-brass-500/50 bg-brass-500/10 text-brass-300' : 'border-ink-700 text-paper-200'}`}
        >
          {i.text}
        </li>
      ))}
    </ul>
  );
}
