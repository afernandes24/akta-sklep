import { generatedDemoCases } from './demo-cases.generated';
import type { CaseRecord } from './types';

/**
 * Dane pokazowe używane TYLKO wtedy, gdy Supabase nie jest jeszcze podłączony
 * (np. pierwsze uruchomienie lokalnie). Te same dane są w supabase/seed.sql
 * i supabase/seed-cases.sql (AKTA #002+, generowane przez content/export.py).
 */
export const demoCases: CaseRecord[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'morderstwo-w-hotelu',
    case_number: '001',
    title: 'Morderstwo w hotelu',
    tagline: 'Znany przedsiębiorca martwy w zamkniętym pokoju. Pięciu podejrzanych. Ktoś kłamie.',
    description:
      'Znany przedsiębiorca zostaje znaleziony martwy w pokoju hotelowym. Policja uważa, że sprawa jest prosta. Detektyw nie jest jednak przekonany.\n\nPięciu podejrzanych przedstawia różne wersje wydarzeń. Każdy z nich miał powód, by nie lubić ofiary — i każdy twierdzi, że tamtej nocy był gdzie indziej.\n\nOtrzymujesz komplet akt: raporty, protokoły przesłuchań, wiadomości, zdjęcia i notatki. Śledztwo rozwija się krok po kroku — każdy znaleziony dowód prowadzi cię dalej. Ktoś kłamie. Twoim zadaniem jest udowodnić, kto.',
    highlights: [
      'Ciągła historia — śledztwo rozwija się krok po kroku, a każda zagadka wynika z fabuły',
      'Przesłuchania pięciu podejrzanych, raporty, wydruki z systemów, wiadomości i szkice z miejsca zdarzenia',
      'Szyfry, oś czasu i sprzeczności w zeznaniach do wychwycenia',
      'Fałszywe tropy i zwrot akcji, który zmienia obraz sprawy',
      'Jedno logiczne rozwiązanie — wszystko, czego potrzebujesz, jest w aktach',
    ],
    contents: [
      '01_INSTRUKCJA.pdf — zasady i przebieg śledztwa',
      '02_AKTA_SPRAWY.pdf — raporty, przesłuchania i dokumenty',
      '03_DOWODY.pdf — 17 dowodów: szkice, wydruki, paragony, wiadomości i podarta kartka do złożenia',
      '04_NOTATNIK_DETEKTYWA.pdf — miejsce na twoje wnioski i oś czasu',
      '05_ROZWIAZANIE.pdf — zapieczętowane rozwiązanie (otwórz na końcu!)',
    ],
    excerpts: [
      {
        type: 'raport',
        title: 'Raport wstępny',
        meta: 'Komenda Miejska Policji · Wydział Kryminalny',
        body: 'Dnia 14 listopada, godz. 7:42, pokojówka hotelu „Grand Aurelia” zgłosiła odnalezienie zwłok mężczyzny w pokoju 512.\n\nDenat: Wiktor Rembowski, lat 58, przedsiębiorca.\nDrzwi zamknięte od wewnątrz na zasuwę. Na stoliku otwarta butelka whisky i jedna szklanka. Brak śladów walki.\n\nWstępna ocena: zgon naturalny lub samobójstwo. Wniosek o umorzenie postępowania.',
        stamp: 'Do weryfikacji',
      },
      {
        type: 'przesluchanie',
        title: 'Protokół przesłuchania świadka — fragment',
        meta: 'Świadek: recepcjonista, zmiana nocna',
        body: '— O której pan Rembowski wrócił do hotelu?\n— Około dwudziestej trzeciej. Był sam. Prosił, żeby nikt mu nie przeszkadzał.\n— Czy ktoś o niego później pytał?\n— Raz, koło północy. Ale to było uzgodnione z panem prezesem.\n— A później?\n— Potem nic. Tylko winda. Tuż przed pierwszą ktoś pojechał na piąte piętro. A ja nikogo nie wpuszczałem.',
      },
      {
        type: 'notatka',
        title: 'Notatka detektywa',
        body: 'Zasuwa od wewnątrz. Jedna szklanka.\nPięć osób widziało go tego wieczoru — i pięć różnych godzin „ostatniego spotkania”.\n\nKtoś kłamie.\n\n→ Sprawdzić: kto jechał windą przed 1:00?',
      },
    ],
    difficulty: 4,
    play_time_minutes: 90,
    page_count: 37,
    suspect_count: 5,
    price_grosze: 2499,
    currency: 'PLN',
    cover_path: null,
    is_published: true,
    sort_order: 1,
    tags: ['morderstwo'],
    seo_title: 'AKTA #001 — Morderstwo w hotelu | Gra detektywistyczna PDF do druku',
    seo_description:
      'Drukowana gra detektywistyczna dla dorosłych: 37 stron akt, 5 podejrzanych, szyfry i przesłuchania. Pobierz PDF, wydrukuj i rozwiąż sprawę w 90 minut.',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  },
  ...generatedDemoCases,
];
