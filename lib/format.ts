const priceFormatter = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });

export function formatPrice(grosze: number, currency = 'PLN'): string {
  if (currency !== 'PLN') {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(grosze / 100);
  }
  return priceFormatter.format(grosze / 100);
}

/** "24,99" | "24.99" | "24" → 2499. Zwraca null, jeśli wartość jest niepoprawna. */
export function parsePriceToGrosze(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace('zł', '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(parseFloat(normalized) * 100);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Warsaw',
  }).format(new Date(iso));
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

/** Polska odmiana: 1 podejrzany, 2 podejrzanych… (dla liczb całkowitych). */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const lastTwo = n % 100;
  const last = n % 10;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

export function slugify(text: string): string {
  const map: Record<string, string> = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };
  return text
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => map[c] ?? c)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function safeFileName(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const cleanBase = slugify(base).replace(/-/g, '_').toUpperCase() || 'PLIK';
  return ext ? `${cleanBase}.${ext}` : cleanBase;
}

export const statusLabels: Record<string, string> = {
  pending: 'Oczekuje na płatność',
  paid: 'Opłacone',
  failed: 'Płatność nieudana',
  cancelled: 'Anulowane',
  refunded: 'Zwrócone',
};
