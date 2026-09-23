/** Przepuszcza tylko ścieżki wewnątrz sklepu (chroni przed open redirect). */
export function safeNext(value: unknown, fallback = '/konto'): string {
  const v = typeof value === 'string' ? value : '';
  if (!v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\')) return fallback;
  return v;
}
