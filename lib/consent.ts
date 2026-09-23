export const CONSENT_KEY = 'akta-zgody-v1';
export const CONSENT_EVENT = 'akta:zgody';
export const OPEN_SETTINGS_EVENT = 'akta:ustawienia-cookies';

export interface Consent {
  analytics: boolean;
  marketing: boolean;
  /** Data wyrażenia/zmiany zgody (ISO) — dowód zgody. */
  ts: string;
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
export const trackingConfigured = Boolean(GA_ID || PIXEL_ID);

export function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

export function saveConsent(c: Omit<Consent, 'ts'>) {
  const previous = readConsent();
  const value: Consent = { ...c, ts: new Date().toISOString() };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  } catch {
    /* tryb prywatny */
  }
  // Wycofanie zgody: usuwamy cookies i przeładowujemy stronę, żeby skrypty przestały działać.
  const withdrawn = (previous?.analytics && !c.analytics) || (previous?.marketing && !c.marketing);
  if (withdrawn) {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      if (/^(_ga|_gid|_fbp|_fbc)/.test(name)) {
        const host = window.location.hostname;
        for (const domain of ['', host, `.${host.replace(/^www\./, '')}`]) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ''}`;
        }
      }
    });
    window.location.reload();
    return;
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}
