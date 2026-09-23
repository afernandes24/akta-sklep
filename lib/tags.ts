/** Tematy spraw — używane w filtrach katalogu i w panelu admina. */
export const CASE_TAGS = [
  { id: 'morderstwo', label: 'Morderstwo' },
  { id: 'katastrofa', label: 'Katastrofa' },
  { id: 'kradziez', label: 'Kradzież' },
  { id: 'zaginiecie', label: 'Zaginięcie' },
  { id: 'szantaz', label: 'Szantaż' },
  { id: 'rodzinna', label: 'Rodzinna (12+)' },
] as const;

export type CaseTagId = (typeof CASE_TAGS)[number]['id'];

export const tagLabel = (id: string) => CASE_TAGS.find((t) => t.id === id)?.label ?? id;
export const isCaseTag = (id: string): id is CaseTagId => CASE_TAGS.some((t) => t.id === id);
