/** Czaszka — jednostka trudności sprawy (kolor z currentColor). */
export function Skull({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`inline-block h-[1em] w-[1em] ${className}`} fill="currentColor" fillRule="evenodd">
      <path d="M12 2.5c-4.8 0-8.5 3.5-8.5 8 0 2.6 1.2 4.7 3.2 6v2.9c0 .6.5 1.1 1.1 1.1h8.4c.6 0 1.1-.5 1.1-1.1v-2.9c2-1.3 3.2-3.4 3.2-6 0-4.5-3.7-8-8.5-8ZM8.6 9.2a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2Zm6.8 0a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2ZM12 13.6l-1.3 2.2h2.6L12 13.6Zm-2.6 4.6h1.3v2.2H9.4v-2.2Zm3.9 0h1.3v2.2h-1.3v-2.2Z" />
    </svg>
  );
}

/** Rząd czaszek: n aktywnych z max. */
export function Skulls({ value, max = 5, activeClass = 'text-brass-400', idleClass = 'text-ink-600' }: { value: number; max?: number; activeClass?: string; idleClass?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-[-0.125em]">
      {Array.from({ length: max }, (_, i) => (
        <Skull key={i} className={i < value ? activeClass : idleClass} />
      ))}
    </span>
  );
}
