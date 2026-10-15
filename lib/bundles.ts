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

/** Pakiety wracają, gdy w katalogu będzie więcej spraw (pakiet z brakującą sprawą i tak się nie wyświetla). */
export const BUNDLES: Bundle[] = [];
