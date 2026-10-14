import { siteConfig } from '../config';
/**
 * ════════════════════════════════════════════════════════════════════
 *  DANE SPRZEDAWCY — uzupełnij ten plik, a wszystkie dokumenty prawne
 *  (regulamin, polityka prywatności, nota prawna, e-maile) zaktualizują się same.
 *  Pola oznaczone [DO UZUPEŁNIENIA …] są podświetlane na stronie.
 * ════════════════════════════════════════════════════════════════════
 */

export const TODO = (what: string) => `[DO UZUPEŁNIENIA: ${what}]`;

export type BusinessType = 'jdg' | 'nierejestrowana' | 'spolka';

export const seller = {
  /** jdg = jednoosobowa działalność (CEIDG), nierejestrowana = działalność nierejestrowana, spolka = sp. z o.o. itp. */
  businessType: 'nierejestrowana' as BusinessType,

  /** Imię i nazwisko przedsiębiorcy lub pełna nazwa firmy (np. „Anna Kowalska Akta Detektywa”). */
  name: 'Aleksander Fernandes',
  /** Adres wykonywania działalności / siedziby. */
  address: 'ul. Ogrodowa 43G, 81-198 Mosty',
  nip: '',
  regon: '',
  /** Tylko dla spółek, np. „KRS 0000123456, Sąd Rejonowy Poznań – Nowe Miasto i Wilda…”. */
  krs: '',
  /** Kapitał zakładowy (tylko spółki z o.o.). */
  shareCapital: '',

  email: siteConfig.contactEmail,
  /** Opcjonalnie. Zostaw pusty, jeśli nie chcesz podawać telefonu. */
  phone: '',

  /** true = czynny podatnik VAT, false = zwolnienie podmiotowe (art. 113 ustawy o VAT). */
  vatPayer: false,

  /** Biuro rachunkowe (odbiorca danych w polityce prywatności). Zostaw pusty, jeśli prowadzisz księgowość sama. */
  accountingOffice: '',

  /**
   * Limit przychodu działalności nierejestrowanej: 225% minimalnego wynagrodzenia na kwartał.
   * 2026: 4806 zł × 2,25 = 10 813,50 zł. Aktualizuj co roku (styczeń) razem z płacą minimalną.
   */
  quarterlyRevenueLimitGrosze: 1081350,

  /** Data wejścia w życie regulaminu i polityki prywatności. */
  effectiveDate: '23 września 2026 r.',
};

/** Dostawcy techniczni wymieniani w polityce prywatności. */
const ALL_PROCESSORS = [
  { name: 'Railway Corporation', role: 'hosting strony internetowej (serwer aplikacji)', location: 'Unia Europejska (Amsterdam, Holandia); firma z siedzibą w USA (standardowe klauzule umowne)' },
  { name: 'Cloudflare, Inc.', role: 'obsługa domeny (DNS), szyfrowanie połączeń i ochrona przed atakami', location: 'globalna sieć serwerów; USA (Data Privacy Framework / standardowe klauzule umowne)' },
  { name: 'Supabase Inc.', role: 'baza danych, logowanie i przechowywanie plików', location: 'serwery w Unii Europejskiej (Frankfurt)' },
  { name: 'Stripe Payments Europe, Ltd.', role: 'obsługa płatności (działa jako odrębny administrator danych płatniczych)', location: 'Irlandia (UE)' },
  { name: 'Google Ireland Limited', role: 'statystyki odwiedzin (Google Analytics) — tylko po wyrażeniu zgody', location: 'Irlandia (UE); możliwy transfer do USA (Data Privacy Framework)' },
  { name: 'Meta Platforms Ireland Limited', role: 'pomiar skuteczności reklam (Piksel Meta) — tylko po wyrażeniu zgody', location: 'Irlandia (UE); możliwy transfer do USA (Data Privacy Framework)' },
  { name: 'Resend (Plus Five Five, Inc.)', role: 'wysyłka e-maili (potwierdzenia zamówień, potwierdzenia zapisu do newslettera i wysyłka sprawy próbnej, e-maile logowania i resetu hasła)', location: 'USA (Data Privacy Framework / standardowe klauzule umowne)' },
];

/** Lista do polityki prywatności — Meta tylko wtedy, gdy Piksel Meta jest włączony. */
export const processors = ALL_PROCESSORS.filter((p) => !p.name.startsWith('Meta') || Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID));

export function sellerIdentity(): string {
  const parts = [seller.name, seller.address];
  if (seller.businessType !== 'nierejestrowana') parts.push(`NIP: ${seller.nip}`, `REGON: ${seller.regon}`);
  if (seller.krs) parts.push(seller.krs);
  if (seller.shareCapital) parts.push(`kapitał zakładowy: ${seller.shareCapital}`);
  return parts.join(', ');
}

export function registryInfo(): string {
  if (seller.businessType === 'nierejestrowana') {
    return 'Sprzedawca prowadzi działalność nierejestrowaną w rozumieniu art. 5 ustawy – Prawo przedsiębiorców.';
  }
  if (seller.businessType === 'jdg') {
    return 'Sprzedawca jest wpisany do Centralnej Ewidencji i Informacji o Działalności Gospodarczej (CEIDG).';
  }
  return seller.krs ? `Sprzedawca jest wpisany do rejestru przedsiębiorców KRS (${seller.krs}).` : TODO('dane z KRS');
}

export function priceTaxInfo(): string {
  return seller.vatPayer
    ? 'Ceny podane w Sklepie są cenami brutto i zawierają podatek VAT.'
    : 'Sprzedawca korzysta ze zwolnienia podmiotowego z VAT (art. 113 ust. 1 ustawy o podatku od towarów i usług). Ceny podane w Sklepie są cenami końcowymi.';
}

export function isLegalDataComplete(): boolean {
  return !JSON.stringify(seller).includes('[DO UZUPEŁNIENIA');
}
