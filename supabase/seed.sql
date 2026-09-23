-- ═══════════════════════════════════════════════════════════════════
--  Przykładowy produkt: AKTA #001 — Morderstwo w hotelu
--  Uruchom po schema.sql. Wszystkie teksty możesz później zmienić
--  w panelu admina (/admin/sprawy).
-- ═══════════════════════════════════════════════════════════════════
insert into public.cases (
  slug, case_number, title, tagline, description, highlights, contents, excerpts,
  difficulty, play_time_minutes, page_count, suspect_count, price_grosze,
  is_published, sort_order, seo_title, seo_description, tags
) values (
  'morderstwo-w-hotelu',
  '001',
  'Morderstwo w hotelu',
  'Znany przedsiębiorca martwy w zamkniętym pokoju. Pięciu podejrzanych. Ktoś kłamie.',
  $txt$Znany przedsiębiorca zostaje znaleziony martwy w pokoju hotelowym. Policja uważa, że sprawa jest prosta. Detektyw nie jest jednak przekonany.

Pięciu podejrzanych przedstawia różne wersje wydarzeń. Każdy z nich miał powód, by nie lubić ofiary — i każdy twierdzi, że tamtej nocy był gdzie indziej.

Otrzymujesz komplet akt: raporty, protokoły przesłuchań, wiadomości, zdjęcia i notatki. Śledztwo rozwija się krok po kroku — każdy znaleziony dowód prowadzi cię dalej. Ktoś kłamie. Twoim zadaniem jest udowodnić, kto.$txt$,
  array[
    'Ciągła historia — śledztwo rozwija się krok po kroku, a każda zagadka wynika z fabuły',
    'Przesłuchania pięciu podejrzanych, raporty, wydruki z systemów, wiadomości i szkice z miejsca zdarzenia',
    'Szyfry, oś czasu i sprzeczności w zeznaniach do wychwycenia',
    'Fałszywe tropy i zwrot akcji, który zmienia obraz sprawy',
    'Jedno logiczne rozwiązanie — wszystko, czego potrzebujesz, jest w aktach'
  ],
  array[
    '01_INSTRUKCJA.pdf — zasady i przebieg śledztwa',
    '02_AKTA_SPRAWY.pdf — raporty, przesłuchania i dokumenty',
    '03_DOWODY.pdf — 17 dowodów: szkice, wydruki, paragony, wiadomości i podarta kartka do złożenia',
    '04_NOTATNIK_DETEKTYWA.pdf — miejsce na twoje wnioski i oś czasu',
    '05_ROZWIAZANIE.pdf — zapieczętowane rozwiązanie (otwórz na końcu!)'
  ],
  $json$[
    {
      "type": "raport",
      "title": "Raport wstępny",
      "meta": "Komenda Miejska Policji · Wydział Kryminalny",
      "body": "Dnia 14 listopada, godz. 7:42, pokojówka hotelu „Grand Aurelia” zgłosiła odnalezienie zwłok mężczyzny w pokoju 512.\n\nDenat: Wiktor Rembowski, lat 58, przedsiębiorca.\nDrzwi zamknięte od wewnątrz na zasuwę. Na stoliku otwarta butelka whisky i jedna szklanka. Brak śladów walki.\n\nWstępna ocena: zgon naturalny lub samobójstwo. Wniosek o umorzenie postępowania.",
      "stamp": "Do weryfikacji"
    },
    {
      "type": "przesluchanie",
      "title": "Protokół przesłuchania świadka — fragment",
      "meta": "Świadek: recepcjonista, zmiana nocna",
      "body": "— O której pan Rembowski wrócił do hotelu?\n— Około dwudziestej trzeciej. Był sam. Prosił, żeby nikt mu nie przeszkadzał.\n— Czy ktoś o niego później pytał?\n— Raz, koło północy. Ale to było uzgodnione z panem prezesem.\n— A później?\n— Potem nic. Tylko winda. Tuż przed pierwszą ktoś pojechał na piąte piętro. A ja nikogo nie wpuszczałem."
    },
    {
      "type": "notatka",
      "title": "Notatka detektywa",
      "body": "Zasuwa od wewnątrz. Jedna szklanka.\nPięć osób widziało go tego wieczoru — i pięć różnych godzin „ostatniego spotkania”.\n\nKtoś kłamie.\n\n→ Sprawdzić: kto jechał windą przed 1:00?"
    }
  ]$json$::jsonb,
  4, 90, 37, 5, 2499,
  true, 1,
  'AKTA #001 — Morderstwo w hotelu | Gra detektywistyczna PDF do druku',
  'Drukowana gra detektywistyczna dla dorosłych: 37 stron akt, 5 podejrzanych, szyfry i przesłuchania. Pobierz PDF, wydrukuj i rozwiąż sprawę w 90 minut.',
  array['morderstwo']
)
on conflict (slug) do nothing;
