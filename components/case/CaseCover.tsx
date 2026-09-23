import { publicStorageUrl } from '@/lib/config';
import { CoverArt, coverTheme } from './CoverArt';

interface Props {
  caseNumber: string;
  title: string;
  coverPath?: string | null;
  size?: 'xs' | 'sm' | 'lg';
  priority?: boolean;
  className?: string;
}

/**
 * Okładka sprawy. Jeśli admin wgrał grafikę — pokazujemy ją.
 * W przeciwnym razie rysujemy teczkę z aktami w CSS (zawsze spójny wygląd).
 */
export function CaseCover({ caseNumber, title, coverPath, size = 'sm', priority, className = '' }: Props) {
  const url = publicStorageUrl('covers', coverPath);
  const lg = size === 'lg';
  const theme = coverTheme(caseNumber);
  const [f1, f2, f3] = theme.folder;

  if (url) {
    return (
      <div className={`relative aspect-[3/4] overflow-hidden rounded-lg bg-ink-800 shadow-paper ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={`Okładka: AKTA #${caseNumber} — ${title}`}
          className="h-full w-full object-cover"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
        />
      </div>
    );
  }

  if (size === 'xs') {
    // Miniatura (koszyk, pakiety): sama teczka ze „zdjęciem” i numerem — bez drobnego tekstu.
    return (
      <div role="img" aria-label={`Okładka: AKTA #${caseNumber} — ${title}`} className={`relative aspect-[3/4] select-none ${className}`}>
        <div
          className="flex h-full flex-col items-center justify-center gap-[8%] rounded-md p-[12%] shadow-paper"
          style={{ background: `linear-gradient(160deg,${f1} 0%,${f2} 55%,${f3} 100%)` }}
        >
          <div className="w-full rotate-[3deg] bg-paper-50 p-[5%] pb-[10%] shadow">
            <CoverArt caseNumber={caseNumber} />
          </div>
          <span className="font-mono text-[11px] font-bold leading-none text-ink-900">#{caseNumber}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Okładka: AKTA #${caseNumber} — ${title}`}
      className={`relative aspect-[3/4] select-none ${lg ? 'pt-7' : 'pt-5'} ${className}`}
    >
      {/* zakładka teczki */}
      <div
        className={`absolute left-0 top-0 ${lg ? 'h-9 w-2/5' : 'h-6 w-2/5'} rounded-t-lg`}
        style={{ background: `linear-gradient(180deg,${theme.tab[0]},${theme.tab[1]})` }}
      >
        <span className={`block px-3 pt-1.5 font-mono font-bold uppercase tracking-widest text-ink-800/80 ${lg ? 'text-sm' : 'text-[10px]'}`}>
          #{caseNumber}
        </span>
      </div>

      {/* teczka */}
      <div
        className="relative h-full overflow-hidden rounded-b-lg rounded-tr-lg shadow-paper"
        style={{
          background:
            `radial-gradient(circle at 75% 80%, rgba(120,80,30,.18), transparent 40%), radial-gradient(circle at 20% 10%, rgba(255,255,255,.35), transparent 50%), linear-gradient(160deg,${f1} 0%,${f2} 55%,${f3} 100%)`,
        }}
      >
        {/* ślad po kubku */}
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: lg ? 150 : 90,
            height: lg ? 150 : 90,
            right: lg ? -30 : -18,
            bottom: lg ? 40 : 22,
            border: `${lg ? 7 : 4}px solid rgba(110,70,25,.13)`,
          }}
        />

        {/* zdjęcie przypięte spinaczem */}
        <div
          aria-hidden
          className={`absolute ${lg ? 'right-8 top-8 w-[44%]' : 'right-4 top-4 w-[46%]'} rotate-[4deg] bg-paper-50 p-1.5 pb-4 shadow-lg`}
        >
          <div className="overflow-hidden" style={{ filter: 'sepia(.15) contrast(1.05)' }}>
            <CoverArt caseNumber={caseNumber} />
          </div>
          <span className={`mt-1 block text-center font-mono text-ink-700 ${lg ? 'text-[10px]' : 'text-[7px]'}`}>FOT. 1</span>
          <svg className={`absolute -top-3 left-3 ${lg ? 'h-10' : 'h-7'}`} viewBox="0 0 16 44" fill="none" stroke="#8d8a84" strokeWidth="2.2">
            <path d="M5 40V8a4 4 0 0 1 8 0v28a2.5 2.5 0 0 1-5 0V12" strokeLinecap="round" />
          </svg>
        </div>

        {/* etykieta */}
        <div className={`absolute inset-x-0 ${lg ? 'bottom-12 px-8' : 'bottom-7 px-4'}`}>
          <div className={`paper -rotate-1 ${lg ? 'p-6' : 'p-3'}`}>
            <p className={`font-mono uppercase tracking-[0.25em] text-ink-600 ${lg ? 'text-xs' : 'text-[8px]'}`}>Akta sprawy nr</p>
            <p className={`font-mono font-bold text-ink-900 ${lg ? 'text-5xl' : 'text-2xl'}`}>#{caseNumber}</p>
            <div className={`my-2 h-px bg-ink-900/30 ${lg ? 'my-3' : ''}`} />
            <p className={`font-serif font-bold leading-tight text-ink-900 ${lg ? 'text-3xl' : 'text-base'}`}>{title}</p>
          </div>
        </div>

        <span className={`stamp absolute ${lg ? 'left-8 top-10 text-base' : 'left-3 top-5 text-[9px]'}`}>{theme.stamp}</span>
      </div>
    </div>
  );
}
