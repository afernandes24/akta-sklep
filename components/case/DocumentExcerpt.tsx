import type { Excerpt } from '@/lib/types';

const typeLabels: Record<Excerpt['type'], string> = {
  raport: 'Raport',
  przesluchanie: 'Protokół przesłuchania',
  notatka: 'Notatka',
  wiadomosc: 'Wiadomość',
  wycinek: 'Wycinek prasowy',
};

export function DocumentExcerpt({ excerpt, index, caseNumber }: { excerpt: Excerpt; index: number; caseNumber: string }) {
  const rotation = ['-rotate-1', 'rotate-1', '-rotate-[0.5deg]'][index % 3];

  if (excerpt.type === 'wiadomosc') {
    return (
      <figure className={`mx-auto w-full max-w-sm rounded-[2rem] border border-ink-600 bg-ink-800 p-4 shadow-paper ${rotation}`}>
        <figcaption className="mb-3 text-center text-xs text-muted">{excerpt.meta || excerpt.title}</figcaption>
        <div className="space-y-2">
          {excerpt.body.split('\n').filter(Boolean).map((line, i) => (
            <p key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${i % 2 ? 'ml-auto bg-brass-500/90 text-ink-950' : 'bg-ink-600 text-paper-50'}`}>
              {line}
            </p>
          ))}
        </div>
      </figure>
    );
  }

  if (excerpt.type === 'notatka') {
    return (
      <figure
        className={`relative p-6 text-ink-900 shadow-paper ${rotation}`}
        style={{
          background: 'repeating-linear-gradient(180deg, #f6eec0 0 27px, #d8cf9f 27px 28px)',
          backgroundColor: '#f6eec0',
        }}
      >
        <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-2 bg-paper-50/70 shadow" />
        <figcaption className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-600">{excerpt.title}</figcaption>
        <p className="whitespace-pre-line font-mono text-[15px] leading-[28px]">{excerpt.body}</p>
      </figure>
    );
  }

  if (excerpt.type === 'wycinek') {
    return (
      <figure className={`paper p-6 ${rotation}`} style={{ clipPath: 'polygon(0 2%, 4% 0, 30% 1%, 62% 0, 100% 1%, 99% 40%, 100% 98%, 70% 100%, 35% 99%, 2% 100%, 0 60%)' }}>
        <p className="border-b border-ink-900/30 pb-1 font-serif text-xs uppercase tracking-[0.3em] text-ink-600">{excerpt.meta || 'Gazeta Codzienna'}</p>
        <figcaption className="mt-3 font-serif text-2xl font-bold leading-tight">{excerpt.title}</figcaption>
        <p className="mt-3 whitespace-pre-line font-serif text-sm leading-relaxed text-ink-800 sm:columns-2 sm:gap-6">{excerpt.body}</p>
      </figure>
    );
  }

  return (
    <figure className={`paper relative p-6 sm:p-8 ${rotation}`}>
      <div className="flex items-start justify-between gap-4 border-b-2 border-double border-ink-900/40 pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-600">{typeLabels[excerpt.type]}</p>
          <figcaption className="mt-1 font-mono text-lg font-bold uppercase leading-snug text-ink-900">{excerpt.title}</figcaption>
          {excerpt.meta && <p className="mt-1 font-mono text-xs text-ink-700">{excerpt.meta}</p>}
        </div>
        <p className="shrink-0 font-mono text-[11px] text-ink-600">
          SPR. {caseNumber}/{String(index + 1).padStart(2, '0')}
        </p>
      </div>
      <p className="mt-4 whitespace-pre-line font-mono text-[14px] leading-relaxed text-ink-900">{excerpt.body}</p>
      {excerpt.stamp && <span className="stamp absolute bottom-5 right-5 bg-transparent text-sm">{excerpt.stamp}</span>}
    </figure>
  );
}
