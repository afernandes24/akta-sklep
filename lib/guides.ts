/** Poradniki SEO — wspólna lista dla stopki i mapy strony. */
export const GUIDES: { href: string; label: string }[] = [
  { href: '/zagadki-kryminalne', label: 'Zagadki kryminalne' },
  { href: '/gra-detektywistyczna-dla-dwojga', label: 'Gra dla dwojga' },
  { href: '/prezent-gra-detektywistyczna', label: 'Gra na prezent' },
  { href: '/gra-kryminalna-online', label: 'Gra kryminalna online' },
];

/** Liczba graczy z listy „Czego można się spodziewać” (np. „Dla 1–4 osób”). null = brak informacji. */
export function maxPlayers(highlights: string[]): number | null {
  for (const h of highlights) {
    const m = h.match(/(\d)\s*[–-]\s*(\d)\s*os/);
    if (m) return Number(m[2]);
  }
  return null;
}

export function playTime(min: number): string {
  if (min < 120) return `${min} min`;
  const h = min / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')} h`;
}
