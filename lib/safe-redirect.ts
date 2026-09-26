/** Przepuszcza tylko ścieżki wewnątrz sklepu (chroni przed open redirect). */
export function safeNext(value: unknown, fallback = '/konto'): string {
  const v = typeof value === 'string' ? value : '';
  // tylko „/ścieżka”: bez „//”, ukośników wstecznych i znaków sterujących/białych (przeglądarki je wycinają → //evil.com)
  if (!v.startsWith('/') || v.startsWith('//') || /[\\\s\u0000-\u001f\u007f]/.test(v)) return fallback;
  try {
    const u = new URL(v, 'https://sklep.invalid');
    if (u.origin !== 'https://sklep.invalid') return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}
