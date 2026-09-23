/**
 * Motywy okładek — każda sprawa ma własne „zdjęcie z akt”, pieczątkę i kolor teczki.
 * Sprawy dodane później w panelu admina (bez własnej okładki) dostają motyw domyślny.
 */
import type { ReactNode } from 'react';

type Theme = { stamp: string; folder: [string, string, string]; tab: [string, string]; art: ReactNode };

const MANILA: Theme['folder'] = ['#dcc592', '#cdb17a', '#bf9f63'];
const MANILA_TAB: Theme['tab'] = ['#d8c08a', '#cbb07a'];

const Plane = ({ fill = '#d9d4c4' }: { fill?: string }) => (
  <g fill={fill}>
    <path d="M8 50 L70 45 Q86 44 92 50 Q86 56 70 56 L12 55 Z" />
    <path d="M10 51 L3 33 L20 48 Z" />
    <path d="M38 49 L62 48 L52 64 L43 64 Z" opacity=".8" />
    <path d="M74 48 H84 L86 50 H74 Z" fill="#2b2f36" opacity=".6" />
  </g>
);

const themes: Record<string, Theme> = {
  '000': {
    stamp: 'Próbka',
    folder: ['#e3d7b8', '#d4c49c', '#c5b283'],
    tab: ['#e0d2ae', '#d2c197'],
    art: (
      <>
        <rect width="100" height="100" fill="url(#g000)" />
        <defs>
          <linearGradient id="g000" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2c2721" /><stop offset="1" stopColor="#15120f" /></linearGradient>
        </defs>
        <g fill="none" stroke="#c9b27a" strokeWidth="1.2" opacity=".75">
          {[8, 13, 18, 23, 28, 33].map((r) => <ellipse key={r} cx="50" cy="52" rx={r * 0.8} ry={r} />)}
        </g>
        <circle cx="62" cy="40" r="17" fill="none" stroke="#e8e2d2" strokeWidth="4" />
        <path d="M74 52 L90 70" stroke="#e8e2d2" strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  '001': {
    stamp: 'Poufne',
    folder: MANILA,
    tab: MANILA_TAB,
    art: (
      <>
        <rect width="100" height="100" fill="#1d1915" />
        <rect x="28" y="14" width="44" height="86" fill="#4a3b2c" stroke="#6d5a44" strokeWidth="1.5" />
        <rect x="34" y="40" width="32" height="22" fill="none" stroke="#5e4c39" strokeWidth="1.2" />
        <rect x="34" y="68" width="32" height="24" fill="none" stroke="#5e4c39" strokeWidth="1.2" />
        <rect x="41" y="23" width="18" height="9" rx="1" fill="#c9b27a" />
        <text x="50" y="30" textAnchor="middle" fontSize="7" fontFamily="monospace" fontWeight="700" fill="#2b2520">512</text>
        <circle cx="64" cy="64" r="2.2" fill="#c9b27a" />
        <g transform="rotate(8 66 70)">
          <rect x="61" y="66" width="11" height="20" rx="1" fill="#b23a30" />
          <circle cx="66.5" cy="69" r="2" fill="#1d1915" />
          <text x="66.5" y="80" textAnchor="middle" fontSize="3.4" fontFamily="sans-serif" fontWeight="700" fill="#f3e9d7">NIE</text>
        </g>
        <rect x="28" y="97" width="44" height="3" fill="#e8c77a" opacity=".85" />
      </>
    ),
  },
  '002': {
    stamp: 'PKBWL',
    folder: ['#c9ccc6', '#b3b8b1', '#9ea49c'],
    tab: ['#c4c7c1', '#b1b5ae'],
    art: (
      <>
        <defs>
          <linearGradient id="g002" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a4e57" /><stop offset=".62" stopColor="#262930" /><stop offset=".62" stopColor="#2c2b20" /><stop offset="1" stopColor="#1b1a13" /></linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#g002)" />
        {[70, 76, 83, 91].map((y, i) => <path key={y} d={`M0 ${y} Q50 ${y - 3 - i} 100 ${y}`} stroke="#3c3a2b" strokeWidth="1.2" fill="none" />)}
        {[[30, 30, 9], [22, 22, 7], [16, 15, 5.5], [11, 9, 4]].map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill="#8a8c90" opacity=".35" />)}
        <g transform="translate(14 4) rotate(28 50 50) scale(.78)"><Plane fill="#e2ddd0" /></g>
        <circle cx="72" cy="70" r="5" fill="#e0913b" opacity=".35" />
      </>
    ),
  },
  '003': {
    stamp: 'Katastrofa',
    folder: ['#c3cbd2', '#aab4bd', '#939ea8'],
    tab: ['#bec6cd', '#a8b2bb'],
    art: (
      <>
        <defs>
          <linearGradient id="g003" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f1a2b" /><stop offset=".64" stopColor="#1f3350" /><stop offset=".64" stopColor="#0b1422" /><stop offset="1" stopColor="#070d17" /></linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#g003)" />
        <circle cx="78" cy="20" r="8" fill="#e8e2c8" />
        <rect x="74" y="68" width="8" height="1.2" fill="#e8e2c8" opacity=".5" />
        <rect x="72" y="73" width="12" height="1" fill="#e8e2c8" opacity=".35" />
        <rect x="75" y="78" width="6" height=".9" fill="#e8e2c8" opacity=".25" />
        <g transform="translate(4 -12) scale(.55)"><Plane fill="#c9d1db" /></g>
        <circle cx="12" cy="19" r="1.3" fill="#e05050" />
        <circle cx="51" cy="16" r="1.3" fill="#6fe07a" />
        <path d="M0 64 Q10 60 22 63 L30 64 Z" fill="#101d12" />
      </>
    ),
  },
  '004': {
    stamp: 'Katastrofa',
    folder: ['#c9c4a4', '#b4ae8b', '#9e9873'],
    tab: ['#c4bf9f', '#b1ab88'],
    art: (
      <>
        <rect width="100" height="100" fill="#121820" />
        <path d="M34 100 L48 60 M66 100 L52 60" stroke="#5a6470" strokeWidth="1.6" />
        {[66, 74, 84, 96].map((y) => <path key={y} d={`M${50 - (y - 55) * 0.5} ${y} H${50 + (y - 55) * 0.5}`} stroke="#3a424c" strokeWidth="1.4" />)}
        <g transform="rotate(-7 50 60)">
          <path d="M30 78 V36 Q30 26 40 26 H60 Q70 26 70 36 V78 Z" fill="#3b424c" stroke="#59616c" />
          <rect x="36" y="33" width="28" height="13" rx="1.5" fill="#d9c27a" />
          <rect x="49" y="33" width="2" height="13" fill="#3b424c" />
          <circle cx="50" cy="64" r="14" fill="#f3e3a0" opacity=".18" />
          <circle cx="50" cy="64" r="4.5" fill="#f6eab8" />
          <rect x="32" y="74" width="8" height="4" fill="#59616c" />
          <rect x="60" y="74" width="8" height="4" fill="#59616c" />
          <text x="50" y="55" textAnchor="middle" fontSize="4.5" fontFamily="monospace" fill="#c8ccd2">BAŁTYK</text>
        </g>
        {[[12, 10], [24, 30], [80, 14], [88, 40], [8, 50], [70, 8]].map(([x, y]) => <path key={x} d={`M${x} ${y} l3 8`} stroke="#8795a5" strokeWidth=".6" opacity=".6" />)}
      </>
    ),
  },
  '005': {
    stamp: 'Kradzież',
    folder: ['#e0cc98', '#d2b983', '#c4a56c'],
    tab: ['#dcc790', '#cfb57e'],
    art: (
      <>
        <defs>
          <radialGradient id="g005" cx=".5" cy=".45" r=".5"><stop offset="0" stopColor="#ffd27a" /><stop offset=".6" stopColor="#e39a2a" /><stop offset="1" stopColor="#9c5410" /></radialGradient>
        </defs>
        <rect width="100" height="100" fill="#1a130d" />
        <polygon points="40,0 60,0 82,78 18,78" fill="#f4e2b8" opacity=".08" />
        <rect x="24" y="30" width="52" height="46" fill="#ffffff" opacity=".05" stroke="#9a8a70" strokeWidth="1.2" />
        <path d="M50 38 C60 50 62 58 56 65 C52 69 46 69 43 64 C39 58 42 49 50 38 Z" fill="url(#g005)" />
        <path d="M47 50 C45 55 46 59 48 61" stroke="#fff3cf" strokeWidth="1.2" fill="none" opacity=".7" />
        <rect x="28" y="76" width="44" height="24" fill="#3a2e22" />
        <rect x="40" y="84" width="20" height="6" fill="#c9b27a" opacity=".8" />
      </>
    ),
  },
  '006': {
    stamp: 'Poufne',
    folder: ['#c1c9cc', '#a9b3b7', '#929da2'],
    tab: ['#bcc4c7', '#a6b0b4'],
    art: (
      <>
        <rect width="100" height="100" fill="#0e1624" />
        <polygon points="50,24 100,10 100,26" fill="#f3e6b0" opacity=".12" />
        <polygon points="50,24 0,14 0,30" fill="#f3e6b0" opacity=".08" />
        <path d="M0 82 Q25 78 50 82 T100 82 V100 H0 Z" fill="#132238" />
        <path d="M30 86 Q38 72 48 80 L62 78 Q72 74 78 88 Z" fill="#1d1f24" />
        <path d="M44 80 L46 30 H54 L56 80 Z" fill="#e8e4da" />
        {[38, 50, 62, 72].map((y) => <path key={y} d={`M${45.5 - (y - 30) * 0.02} ${y} H${54.5 + (y - 30) * 0.02} V${y + 5} H${45.5 - (y - 30) * 0.02} Z`} fill="#b23a30" />)}
        <rect x="45" y="20" width="10" height="10" fill="#2a2f38" stroke="#8a8f98" strokeWidth=".8" />
        <path d="M43 20 L50 13 L57 20 Z" fill="#b23a30" />
        <circle cx="50" cy="25" r="2" fill="#f3e6b0" opacity=".5" />
      </>
    ),
  },
  '007': {
    stamp: 'Pilne',
    folder: ['#d6b9a4', '#c6a08a', '#b38a73'],
    tab: ['#d2b39d', '#c39c86'],
    art: (
      <>
        <rect width="100" height="100" fill="#1e0f0f" />
        {[18, 23, 28, 33, 38].map((y) => <path key={y} d={`M0 ${y} H100`} stroke="#6b3a34" strokeWidth=".5" />)}
        <g transform="rotate(-24 50 55)">
          <path d="M50 30 C40 30 36 38 39 46 C41 50 41 52 39 55 C35 62 37 74 50 76 C63 74 65 62 61 55 C59 52 59 50 61 46 C64 38 60 30 50 30 Z" fill="#8a3b1f" stroke="#c9713f" strokeWidth=".8" />
          <path d="M44 50 q-2 4 0 8 M56 50 q2 4 0 8" stroke="#1e0f0f" strokeWidth="1.2" fill="none" />
          <rect x="48.5" y="6" width="3" height="40" fill="#1a1210" />
          <circle cx="50" cy="5" r="3" fill="#1a1210" />
          {[48.9, 49.6, 50.3, 51].map((x) => <path key={x} d={`M${x} 8 V70`} stroke="#d9d4c4" strokeWidth=".25" />)}
          <rect x="45" y="66" width="10" height="2" fill="#1a1210" />
        </g>
      </>
    ),
  },
  '008': {
    stamp: 'Poufne',
    folder: ['#cfd0cc', '#b9bbb6', '#a3a6a0'],
    tab: ['#cacbc7', '#b6b8b3'],
    art: (
      <>
        <rect width="100" height="100" fill="#1b2230" />
        <polygon points="0,70 26,30 48,62 66,26 100,68 100,100 0,100" fill="#8e98aa" />
        <polygon points="26,30 18,42 26,40 32,46 36,44" fill="#e8ecf2" />
        <polygon points="66,26 56,42 64,38 70,44 76,40" fill="#e8ecf2" />
        <path d="M0 80 Q50 70 100 80 V100 H0 Z" fill="#e3e8ef" />
        <path d="M36 82 V68 L48 58 L60 68 V82 Z" fill="#4a3b2c" />
        <path d="M33 69 L48 55 L63 69" stroke="#f3f5f8" strokeWidth="3" fill="none" />
        <rect x="44" y="70" width="8" height="7" fill="#e8c77a" />
        {[[10, 12], [22, 20], [40, 8], [58, 16], [80, 10], [90, 24], [14, 50], [84, 50], [50, 40]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="#f3f5f8" opacity=".8" />)}
      </>
    ),
  },
  '009': {
    stamp: 'Szantaż',
    folder: MANILA,
    tab: MANILA_TAB,
    art: (
      <>
        <rect width="100" height="100" fill="#221e19" />
        <g transform="rotate(-9 50 55)">
          <rect x="16" y="30" width="68" height="46" fill="#ece5d3" />
          <path d="M16 30 L50 56 L84 30" stroke="#b8ad95" strokeWidth="1.2" fill="none" />
          <rect x="66" y="34" width="14" height="10" fill="#b23a30" opacity=".85" />
        </g>
        {[
          ['W', 14, 16, '#f3e9d7', '#1c1a17', 'serif', -8],
          ['I', 28, 14, '#1c1a17', '#f3e9d7', 'monospace', 6],
          ['E', 40, 18, '#e8c77a', '#1c1a17', 'serif', -4],
          ['M', 54, 13, '#f3e9d7', '#b23a30', 'sans-serif', 5],
          ['?', 72, 16, '#b23a30', '#f3e9d7', 'serif', -10],
        ].map(([ch, x, y, bg, fg, ff, rot]) => (
          <g key={String(ch)} transform={`rotate(${rot} ${Number(x) + 5} ${Number(y)})`}>
            <rect x={Number(x)} y={Number(y) - 8} width="11" height="12" fill={String(bg)} />
            <text x={Number(x) + 5.5} y={Number(y) + 1.5} textAnchor="middle" fontSize="10" fontWeight="700" fontFamily={String(ff)} fill={String(fg)}>{ch}</text>
          </g>
        ))}
      </>
    ),
  },
  '010': {
    stamp: 'Zaginiona',
    folder: ['#c6cdb9', '#afb89f', '#98a287'],
    tab: ['#c1c8b3', '#abb49b'],
    art: (
      <>
        <rect width="100" height="100" fill="#0c1716" />
        <rect x="8" y="8" width="18" height="20" fill="none" stroke="#6fc3a0" strokeWidth="1" opacity=".7" />
        <text x="10" y="14" fontSize="4.5" fontFamily="monospace" fill="#6fc3a0" opacity=".8">92</text>
        <text x="17" y="25" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="sans-serif" fill="#6fc3a0" opacity=".8">U</text>
        <path d="M43 18 H57 V40 L74 82 Q76 88 70 88 H30 Q24 88 26 82 L43 40 Z" fill="#ffffff" opacity=".1" stroke="#dfe8e4" strokeWidth="1.5" />
        <path d="M34 62 H66 L73 82 Q75 86 70 86 H30 Q25 86 27 82 Z" fill="#6fc3a0" opacity=".85" />
        {[[44, 74, 2.2], [55, 70, 1.6], [50, 64, 1.2], [60, 78, 1.8], [48, 54, 1.1], [52, 46, 0.9]].map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#dff7ec" opacity=".75" />)}
        <rect x="41" y="14" width="18" height="4" fill="#dfe8e4" opacity=".8" />
      </>
    ),
  },
  '011': {
    stamp: 'Poszukiwania',
    folder: ['#bfc9cf', '#a6b3ba', '#8e9ca4'],
    tab: ['#bac4ca', '#a3b0b7'],
    art: (
      <>
        <rect width="100" height="100" fill="#0d1826" />
        {[[10, 0], [26, 4], [42, 0], [58, 6], [74, 2], [90, 0]].map(([x, y]) => <path key={x} d={`M${x} ${y} l-10 30`} stroke="#8aa0b8" strokeWidth=".5" opacity=".45" />)}
        <path d="M60 4 L54 20 L60 20 L52 36" stroke="#f3e6b0" strokeWidth="1.2" fill="none" opacity=".8" />
        <path d="M52 22 L52 66 L30 66 Z" fill="#d9d4c4" />
        <path d="M55 26 L55 66 L72 66 Z" fill="#b9b3a2" />
        <rect x="52" y="20" width="1.6" height="48" fill="#8f8a7c" />
        <path d="M24 68 H80 L72 78 H32 Z" fill="#1c1a17" stroke="#3a4a5c" strokeWidth=".6" />
        <path d="M0 76 Q12 70 25 76 T50 76 T75 76 T100 76 V100 H0 Z" fill="#132a44" />
        <path d="M0 86 Q12 80 25 86 T50 86 T75 86 T100 86 V100 H0 Z" fill="#0f2238" />
        <circle cx="16" cy="88" r="6" fill="none" stroke="#e05040" strokeWidth="3" strokeDasharray="4.7 4.7" />
        <circle cx="16" cy="88" r="6" fill="none" stroke="#f3f0e8" strokeWidth="3" strokeDasharray="4.7 4.7" strokeDashoffset="4.7" />
      </>
    ),
  },
};

const fallback: Theme = {
  stamp: 'Poufne',
  folder: MANILA,
  tab: MANILA_TAB,
  art: (
    <>
      <defs>
        <linearGradient id="gdef" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a3630" /><stop offset="1" stopColor="#1f1c18" /></linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#gdef)" />
      <circle cx="50" cy="38" r="17" fill="#6b645a" />
      <ellipse cx="50" cy="100" rx="36" ry="30" fill="#5b554c" />
    </>
  ),
};

export function coverTheme(caseNumber: string): Theme {
  return themes[caseNumber] ?? fallback;
}

export function CoverArt({ caseNumber }: { caseNumber: string }) {
  return (
    <svg viewBox="0 0 100 100" className="block aspect-square w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      {coverTheme(caseNumber).art}
    </svg>
  );
}
