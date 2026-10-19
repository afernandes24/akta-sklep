/**
 * Ciasteczko „nie licz mnie” — urządzenie właściciela nie trafia do statystyk sklepu ani do Google Analytics.
 * Ustawiane automatycznie przy wejściu do panelu admina (i przełącznikiem w Admin → Statystyki).
 * Celowo NIE httpOnly — sprawdza je też skrypt w przeglądarce, zanim cokolwiek wyśle.
 */
export const EXCLUDE_COOKIE = 'akta_nie_licz';
export const EXCLUDE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 miesięcy (limit przeglądarek)

export function isExcludedClient(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c === `${EXCLUDE_COOKIE}=1`);
}

export function setExcludedClient(on: boolean) {
  document.cookie = on
    ? `${EXCLUDE_COOKIE}=1; Path=/; Max-Age=${EXCLUDE_MAX_AGE}; SameSite=Lax; Secure`
    : `${EXCLUDE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}
