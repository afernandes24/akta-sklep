/**
 * Działy spraw (kolumna cases.tags) — filtry w katalogu i checkboxy w panelu admina.
 * `id` zostaje w bazie; `label` to nazwa widoczna dla klientów — można ją zmieniać bez migracji.
 * Dział pojawia się w katalogu dopiero, gdy ma choć jedną sprawę.
 */
export const CASE_TAGS = [
  { id: 'morderstwo', label: 'Krwawe akta', hint: 'morderstwa' },
  { id: 'katastrofa', label: 'Czarna skrzynka', hint: 'katastrofy i wypadki' },
  { id: 'milosna', label: 'Zbrodnie z miłości', hint: 'miłość, zazdrość, zdrada' },
  { id: 'zaginiecie', label: 'Bez śladu', hint: 'zaginięcia' },
  { id: 'kradziez', label: 'Wielki skok', hint: 'kradzieże i napady' },
  { id: 'szantaz', label: 'Brudne sekrety', hint: 'szantaż, anonimy, afery' },
  { id: 'prl', label: 'Archiwum PRL', hint: 'sprawy z dawnych lat' },
  { id: 'szpiegowska', label: 'Ściśle tajne', hint: 'szpiegostwo i wywiad' },
  { id: 'zimna', label: 'Zimne sprawy', hint: 'stare, nierozwiązane śledztwa' },
  { id: 'rodzinna', label: 'Dla całej rodziny', hint: '12+, bez drastycznych scen' },
] as const;

export type CaseTagId = (typeof CASE_TAGS)[number]['id'];

export const tagLabel = (id: string) => CASE_TAGS.find((t) => t.id === id)?.label ?? id;
export const isCaseTag = (id: string): id is CaseTagId => CASE_TAGS.some((t) => t.id === id);

/** Specjalny dział: sprawy osadzone w konkretnym mieście (pole cases.city). */
export const CITY_SECTION = { id: 'miasto', label: 'Mapa zbrodni', hint: 'sprawy z polskich miast' } as const;

/** Poziomy trudności 1–5 (czaszki) z nazwami stopni. */
export const LEVEL_NAMES: Record<number, string> = {
  1: 'Nowicjusz',
  2: 'Posterunkowy',
  3: 'Detektyw',
  4: 'Inspektor',
  5: 'Komisarz',
};
export const levelName = (d: number) => LEVEL_NAMES[Math.min(5, Math.max(1, Math.round(d)))] ?? '';
