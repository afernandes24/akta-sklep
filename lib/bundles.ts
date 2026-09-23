/**
 * Pakiety tematyczne. Pakiet to po prostu kilka spraw dodanych naraz do koszyka —
 * cenę obniża automatyczny rabat ilościowy (lib/pricing.ts), więc nie ma osobnych produktów.
 * Aby zmienić pakiety, edytuj tę listę (slug-i spraw z panelu admina).
 */
export interface Bundle {
  id: string;
  title: string;
  description: string;
  caseSlugs: string[];
}

export const BUNDLES: Bundle[] = [
  {
    id: 'katastrofy',
    title: 'Pakiet „Katastrofy”',
    description: 'Dwa samoloty i nocny pociąg. Śledztwa komisji badania wypadków.',
    caseSlugs: ['ostatni-lot-sp-krw', 'katastrofa-nad-sniardwami', 'nocny-ekspres-baltyk'],
  },
  {
    id: 'na-start',
    title: 'Pakiet „Na start”',
    description: 'Trzy przystępne sprawy na pierwszy wieczór detektywistyczny.',
    caseSlugs: ['lza-baltyku', 'anonimy', 'morderstwo-w-hotelu'],
  },
  {
    id: 'dla-wyjadaczy',
    title: 'Pakiet „Dla wyjadaczy”',
    description: 'Najtrudniejsze akta w archiwum. Tylko dla wprawionych detektywów.',
    caseSlugs: ['ostatni-akord', 'zaginiona-z-laboratorium', 'czlowiek-za-burta'],
  },
];
