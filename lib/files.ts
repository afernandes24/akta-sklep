/**
 * Rodzaj pliku sprawy rozpoznawany po nazwie (bez zmian w bazie):
 * - solution — rozwiązanie / odpowiedzi (ukryte za ostrzeżeniem, „koperta” w wersji online),
 * - hint     — wskazówki / podpowiedzi (zwinięte, otwierane na żądanie),
 * - material — reszta (instrukcja, akta, dowody…).
 */
export type FileKind = 'material' | 'hint' | 'solution';

const strip = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l');

export function fileKind(name: string, isSolutionFlag = false): FileKind {
  const n = strip(name);
  if (isSolutionFlag || /rozwiazan|odpowiedz|answer|solution/.test(n)) return 'solution';
  if (/wskazow|podpowiedz|clue|hint/.test(n)) return 'hint';
  return 'material';
}

export const isSolutionName = (name: string) => fileKind(name) === 'solution';

/** „03_Akta_sprawy.pdf” → „Akta sprawy”. */
export function labelFromFileName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, '').replace(/^\d+[_\s.-]*/, '').replace(/[_-]+/g, ' ').trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() : fileName;
}

const ORDER: Record<FileKind, number> = { material: 0, hint: 1, solution: 2 };
/** Kolejność wyświetlania: materiały, wskazówki, odpowiedzi; w grupie — po nazwie. */
export const byKindThenName = <T extends { name: string; kind: FileKind }>(a: T, b: T) =>
  ORDER[a.kind] - ORDER[b.kind] || a.name.localeCompare(b.name, 'pl', { numeric: true });
