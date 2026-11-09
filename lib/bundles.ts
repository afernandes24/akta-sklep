/**
 * Pakiety. Pakiet to kilka spraw dodanych naraz do koszyka —
 * cenę obniża automatyczny rabat ilościowy (lib/pricing.ts), więc nie ma osobnych produktów.
 * Aby zmienić pakiety, edytuj tę listę (slug-i spraw z panelu admina).
 * Pakiet, w którym brakuje którejś sprawy (np. nieopublikowanej), po prostu się nie wyświetla.
 */
export interface Bundle {
  id: string;
  title: string;
  description: string;
  caseSlugs: string[];
}

export const BUNDLES: Bundle[] = [
  {
    id: 'bestsellery',
    title: 'Najchętniej wybierane',
    description: 'Trzy sprawy, które kupujecie najczęściej — dobry start, jeśli nie wiesz, od czego zacząć.',
    caseSlugs: ['pusty-grob', 'kolacja-w-ciemnosci', 'martwi-nie-wracaja'],
  },
  {
    id: 'w-trase',
    title: 'Przez całą Polskę',
    description: 'Wybrzeże, góry i miasto — trzy zupełnie różne śledztwa na trzy wieczory.',
    caseSlugs: ['cisza-po-sezonie', 'alarm-na-wysokosci', 'czarna-tasma'],
  },
  {
    id: 'archiwum',
    title: 'Całe archiwum',
    description: 'Wszystkie sprawy naraz, z największym rabatem. Na długie wieczory albo jako prezent dla fana kryminałów.',
    caseSlugs: ['pusty-grob', 'kolacja-w-ciemnosci', 'martwi-nie-wracaja', 'cisza-po-sezonie', 'alarm-na-wysokosci', 'czarna-tasma'],
  },
];
