-- ═══════════════════════════════════════════════════════════════════
--  Produkty AKTA #002 i kolejne — wygenerowane przez content/export.py
--  Uruchom po schema.sql i seed.sql. Istniejących spraw nie nadpisuje.
--  Potem: npm run seed:files  (wgrywa PDF-y i podglądy wszystkich spraw)
-- ═══════════════════════════════════════════════════════════════════

insert into public.cases (
  slug, case_number, title, tagline, description, highlights, contents, excerpts,
  difficulty, play_time_minutes, page_count, suspect_count, price_grosze,
  is_published, sort_order, seo_title, seo_description, tags, city
) values (
  'ostatni-lot-sp-krw',
  '002',
  'Ostatni lot SP-KRW',
  'Samolot spada pod Lęborkiem. W papierach wszystko się zgadza — i to jest najbardziej podejrzane.',
  $txt$Sześciomiejscowy samolot SP-KRW rozbija się na polu pod Lęborkiem, a pilot ginie na miejscu. Książka techniczna twierdzi, że samolot był sprawny. Wrak mówi co innego.

Jako członek komisji badania wypadków lotniczych porównujesz numery seryjne, rejestry drzwi, e-maile i podpisy. Prokurator ma już podejrzanego — mechanika, którego pieczątka widnieje we wpisie. Ale czy to on go zrobił?

Sprawa o odpowiedzialności, strachu i jednym podpisie, który kosztował ludzkie życie.$txt$,
  array[
    'Śledztwo komisji badania wypadków — od wraku po biuro prezesa',
    'Numery seryjne, rejestry drzwi, zapis korespondencji radiowej',
    'Szyfr liczbowy i ekspertyza pisma',
    'Zatrzymany mechanik, ostrzeżenie SMS-em i trudne pytania o winę',
    'Jedno logiczne rozwiązanie — bez zgadywania'
  ],
  array[
    '01_INSTRUKCJA.pdf — zasady i przebieg śledztwa',
    '02_AKTA_SPRAWY.pdf — 5 etapów: raporty, przesłuchania i zadania',
    '03_DOWODY.pdf — 14 dowodów rzeczowych',
    '04_NOTATNIK_DETEKTYWA.pdf — kartoteka, oś czasu i raport końcowy',
    '05_ROZWIAZANIE.pdf — zapieczętowane rozwiązanie (otwórz na końcu!)'
  ],
  $json$[
  {
    "type": "raport",
    "title": "Zgłoszenie zdarzenia lotniczego",
    "meta": "Państwowa Komisja Badania Wypadków Lotniczych",
    "body": "Start z EPGD o 07:40. O 08:02 pilot zgłosił zapach paliwa w kabinie i spadek mocy lewego silnika.\n\nO 08:07 — ostrzeżenie o pożarze. Kontakt radiowy utracony o 08:10.\n\nPilot, kpt. Paweł Rogala, poniósł śmierć na miejscu.",
    "stamp": "Zdarzenie badane"
  },
  {
    "type": "przesluchanie",
    "title": "Protokół przesłuchania — fragment",
    "meta": "Mechanik lotniczy, pieczątka M-07",
    "body": "— To pański podpis i pańska pieczątka.\n— Pieczątka tak. Podpis nie jest mój.\n— Kto ma klucz do szafki z pieczątkami?\n— Ja mam swój. Zapasowy wisi w sejfie."
  },
  {
    "type": "notatka",
    "title": "Notatka badacza",
    "body": "Papier mówi: przewód wymieniony 12 października.\nWrak mówi: przewód z 2019 roku.\n\nKtoś kłamie. Pytanie — kto trzymał długopis?"
  }
]$json$::jsonb,
  3, 75, 29, 5, 2499,
  true, 2,
  'AKTA #002 — Ostatni lot SP-KRW | Gra detektywistyczna PDF o katastrofie lotniczej',
  'Drukowana gra detektywistyczna: katastrofa samolotu pod Lęborkiem, sfałszowana książka techniczna i 5 podejrzanych. Pobierz PDF i rozwiąż sprawę w 75 minut.',
  array[
    'katastrofa'
  ],
  'Lębork'
)
on conflict (slug) do nothing;

insert into public.cases (
  slug, case_number, title, tagline, description, highlights, contents, excerpts,
  difficulty, play_time_minutes, page_count, suspect_count, price_grosze,
  is_published, sort_order, seo_title, seo_description, tags, city
) values (
  'katastrofa-nad-sniardwami',
  '003',
  'Katastrofa nad Śniardwami',
  'Samolot wpada do jeziora. Kabina jest pusta. Wszyscy szukają ciała — ty szukasz prawdy.',
  $txt$Wieczorem 5 września samolot przedsiębiorcy Grzegorza Lipskiego znika z radaru nad Śniardwami. Nurkowie wyciągają wrak, ale kabina jest pusta. Żona dostanie 4 miliony z polisy, wierzyciele stracą nadzieję, sąd umorzy proces.

Śledzisz trasę lotu na mapie i zapis radaru, czytasz zaszyfrowany kalendarz, porównujesz paragony, kamery drogowe i listy pasażerów. Prokuratura ma już podejrzaną — żonę. Ale czy w tej sprawie w ogóle jest ofiara?

Sprawa o katastrofie, która nie była tym, czym się wydawała.$txt$,
  array[
    'Mapa trasy i zapis radaru — analiza lotu minuta po minucie',
    'Szyfr w kalendarzu i historia rachunku bankowego',
    'Kamery drogowe, paragon ze stacji i listy pasażerów',
    'Zwrot akcji, który zmienia pytanie „kto zabił?”',
    'Jedno logiczne rozwiązanie — wszystko w aktach'
  ],
  array[
    '01_INSTRUKCJA.pdf — zasady i przebieg śledztwa',
    '02_AKTA_SPRAWY.pdf — 5 etapów: raporty, przesłuchania i zadania',
    '03_DOWODY.pdf — 14 dowodów rzeczowych',
    '04_NOTATNIK_DETEKTYWA.pdf — kartoteka, oś czasu i raport końcowy',
    '05_ROZWIAZANIE.pdf — zapieczętowane rozwiązanie (otwórz na końcu!)'
  ],
  $json$[
  {
    "type": "raport",
    "title": "Informacja wstępna PKBWL",
    "meta": "Zdarzenie SP-GLE",
    "body": "Ostatnia korespondencja radiowa: 21:27, „wszystko w normie, nad Krutynią”.\n\nPóźniej brak łączności, brak wezwania pomocy.\n\nWrak wydobyto z głębokości 6 m. Ciała pilota nie odnaleziono.",
    "stamp": "Wstępne"
  },
  {
    "type": "przesluchanie",
    "title": "Protokół przesłuchania — fragment",
    "meta": "Mechanik lotniczy",
    "body": "— Co było w szafce pilota?\n— Kamizelka, apteczka, dwa spadochrony. Lubił mieć spadochron na pokładzie.\n— W samolocie po wypadku nie było spadochronu.\n— To niemożliwe."
  },
  {
    "type": "notatka",
    "title": "Notatka detektywa",
    "body": "Pusta kabina.\nPas zapięty na pustym fotelu.\nKto zapina pas, zanim zginie?\n\n→ Sprawdzić zapis radaru."
  }
]$json$::jsonb,
  4, 90, 27, 5, 2499,
  true, 3,
  'AKTA #003 — Katastrofa nad Śniardwami | Gra detektywistyczna PDF',
  'Drukowana gra detektywistyczna: samolot wpada do jeziora Śniardwy, ciała pilota nie ma. Radar, szyfry, kamery drogowe i 5 podejrzanych. Pobierz PDF i rozwiąż sprawę.',
  array[
    'katastrofa',
    'zaginiecie',
    'milosna'
  ],
  null
)
on conflict (slug) do nothing;

insert into public.cases (
  slug, case_number, title, tagline, description, highlights, contents, excerpts,
  difficulty, play_time_minutes, page_count, suspect_count, price_grosze,
  is_published, sort_order, seo_title, seo_description, tags, city
) values (
  'nocny-ekspres-baltyk',
  '004',
  'Nocny ekspres „Bałtyk”',
  'Pociąg wypada z szyn w czasie orkanu. Jeden pasażer nie żyje — tylko że zmarł, zanim pociąg się wykoleił.',
  $txt$Nocny pociąg z Krakowa do Gdyni uderza w powalone drzewo. Cudem nikt nie ginie — poza starszym pasażerem wagonu sypialnego, którego zgon stwierdza lekarka z sąsiedniego przedziału. Uraz głowy przy hamowaniu. Tragiczny przypadek.

Ale wagon, w którym jechał, nawet się nie przewrócił. Analizujesz plan wagonu, kartę konduktora, rachunki z WARS-u, protokół sekcji i notes zapisany alfabetem Morse’a. Każdy pasażer siódemki coś ukrywa.

Klasyczna zagadka zamkniętego wagonu — z katastrofą w tle.$txt$,
  array[
    'Wykolejenie w czasie orkanu i śmierć, która wydarzyła się wcześniej',
    'Plan wagonu sypialnego, karta konduktora, rachunki z wagonu restauracyjnego',
    'Notes zapisany alfabetem Morse’a i podarte dokumenty do złożenia',
    'Zegarek, który wskazuje złą godzinę — i świadek, który widział tylko plecy',
    'Jedno logiczne rozwiązanie — bez zgadywania'
  ],
  array[
    '01_INSTRUKCJA.pdf — zasady i przebieg śledztwa',
    '02_AKTA_SPRAWY.pdf — 5 etapów: raporty, przesłuchania i zadania',
    '03_DOWODY.pdf — 14 dowodów rzeczowych',
    '04_NOTATNIK_DETEKTYWA.pdf — kartoteka, oś czasu i raport końcowy',
    '05_ROZWIAZANIE.pdf — zapieczętowane rozwiązanie (otwórz na końcu!)'
  ],
  $json$[
  {
    "type": "raport",
    "title": "Informacja wstępna",
    "meta": "Państwowa Komisja Badania Wypadków Kolejowych",
    "body": "Najechanie na drzewo powalone przez wiatr. Wykolejeniu uległy: lokomotywa oraz wagony 1–3.\n\nWagony 4–9 pozostały na torze.\n\nRanni: 14 osób. Jedna ofiara śmiertelna — wagon 7, przedział 5.",
    "stamp": "PKBWK"
  },
  {
    "type": "przesluchanie",
    "title": "Protokół przesłuchania — fragment",
    "meta": "Konduktor wagonu sypialnego",
    "body": "— O 22:55 zaniosłem herbatę do piątki. Pukałem, nikt nie otworzył.\n— Co pan pomyślał?\n— Że śpi.\n— A po wykolejeniu?\n— Zawołałem panią doktor z czwórki. Przyszła od razu. Jakby czekała."
  },
  {
    "type": "notatka",
    "title": "Notatka detektywa",
    "body": "Wagon 7 stał na szynach.\nBagaże pospadały, herbata się rozlała.\nA pasażer z piątki nie żyje?\n\n→ Poprosić o sekcję. Szybko."
  }
]$json$::jsonb,
  4, 90, 28, 5, 2499,
  true, 4,
  'AKTA #004 — Nocny ekspres „Bałtyk” | Gra detektywistyczna PDF o katastrofie kolejowej',
  'Drukowana gra detektywistyczna: wykolejenie nocnego pociągu i zagadkowa śmierć w wagonie sypialnym. Szyfr Morse’a, plan wagonu i 5 podejrzanych. Pobierz PDF.',
  array[
    'katastrofa',
    'morderstwo'
  ],
  null
)
on conflict (slug) do nothing;

insert into public.cases (
  slug, case_number, title, tagline, description, highlights, contents, excerpts,
  difficulty, play_time_minutes, page_count, suspect_count, price_grosze,
  is_published, sort_order, seo_title, seo_description, tags, city
) values (
  'lza-baltyku',
  '005',
  'Łza Bałtyku',
  'W Noc Muzeów ktoś podmienia bursztyn wart 2,4 mln zł na pamiątkę ze sklepu za 89 zł.',
  $txt$Noc Muzeów w Gdańsku, tłumy zwiedzających i najcenniejszy eksponat: „Łza Bałtyku” — bursztyn z zatopioną jaszczurką. Rano w gablocie leży podróbka ze sklepu muzealnego. Szyba cała, zamek sprawny, kamera wyłączona na sześć minut.

Analizujesz logi zamka i monitoringu, zapis krótkofalówek, sprzedaż w sklepie i księgę pamiątkową, w której ktoś ukrył wiadomość. Prokurator chce zatrzymać konserwatorkę — to jej kod otworzył gablotę.

Sprawa bez przemocy, idealna na rodzinny wieczór i na pierwsze śledztwo.$txt$,
  array[
    'Kradzież bez przemocy — dobra sprawa na start i na wieczór z rodziną (12+)',
    'Logi zamka, monitoringu i krótkofalówek do zestawienia minuta po minucie',
    'Ukryta wiadomość w księdze pamiątkowej',
    'Plan sali, grafik wolontariuszy i nagranie z kasy',
    'Jedno logiczne rozwiązanie'
  ],
  array[
    '01_INSTRUKCJA.pdf — zasady i przebieg śledztwa',
    '02_AKTA_SPRAWY.pdf — 5 etapów: raporty, przesłuchania i zadania',
    '03_DOWODY.pdf — 13 dowodów rzeczowych',
    '04_NOTATNIK_DETEKTYWA.pdf — kartoteka, oś czasu i raport końcowy',
    '05_ROZWIAZANIE.pdf — zapieczętowane rozwiązanie (otwórz na końcu!)'
  ],
  $json$[
  {
    "type": "raport",
    "title": "Zawiadomienie o przestępstwie",
    "meta": "Muzeum Złota Bałtyku",
    "body": "W gablocie nr 1 zamiast oryginału „Łzy Bałtyku” znajduje się replika z żywicy syntetycznej.\n\nGablota nie nosi śladów włamania — zamek sprawny, szyba cała.",
    "stamp": "Zgłoszone"
  },
  {
    "type": "przesluchanie",
    "title": "Protokół przesłuchania — fragment",
    "meta": "Ochroniarz, stanowisko monitoringu",
    "body": "— Dlaczego kamera była wyłączona?\n— Ktoś przez radio powiedział, że dyrektor prosi o restart.\n— Kto mówił?\n— Młody głos. Szumiało. Nie pytałem o imię."
  },
  {
    "type": "notatka",
    "title": "Notatka detektywa",
    "body": "Sześć minut bez kamery.\nKod konserwatorki.\nReplika z własnego sklepu muzeum.\n\n→ Kto kupił podróbkę?"
  }
]$json$::jsonb,
  2, 60, 24, 5, 1999,
  true, 5,
  'AKTA #005 — Łza Bałtyku | Rodzinna gra detektywistyczna PDF o kradzieży w muzeum',
  'Drukowana gra detektywistyczna dla rodzin (12+): kradzież bursztynu w Noc Muzeów, logi kamer, ukryta wiadomość i 5 podejrzanych. Pobierz PDF i rozwiąż w 60 minut.',
  array[
    'kradziez',
    'rodzinna'
  ],
  'Gdańsk'
)
on conflict (slug) do nothing;

insert into public.cases (
  slug, case_number, title, tagline, description, highlights, contents, excerpts,
  difficulty, play_time_minutes, page_count, suspect_count, price_grosze,
  is_published, sort_order, seo_title, seo_description, tags, city
) values (
  'latarnik',
  '006',
  'Latarnik',
  'W sztormową noc latarnia gaśnie na 25 minut. Rano latarnik leży martwy u stóp schodów.',
  $txt$Półwysep Helski, sztorm. O 23:41 latarnia na cyplu gaśnie, o 00:06 zapala się znowu. Rano przewodniczka znajduje ciało latarnika u podstawy spiralnych schodów. Policja mówi: poślizgnął się, idąc naprawić światło.

Ale deszcz przestał padać o 23:30, a ziemia wokół latarni zapamiętała każdy krok. Analizujesz ślady butów, zapis Urzędu Morskiego, fotoradar i dziennik latarnika, w którym ostatni wpis zapisano szyfrem.

Kameralna, klimatyczna sprawa o rodzinie, spadku i jednym wyłączniku.$txt$,
  array[
    'Ślady na mokrej ziemi — kto szedł, skąd i czy wrócił',
    'Szyfr latarnika (kwadrat Polibiusza) z kluczem wiszącym na ścianie',
    'Zapis Urzędu Morskiego, fotoradar i paragon ze stacji',
    'Pięciu podejrzanych i testament, którego nie zdążono podpisać',
    'Jedno logiczne rozwiązanie'
  ],
  array[
    '01_INSTRUKCJA.pdf — zasady i przebieg śledztwa',
    '02_AKTA_SPRAWY.pdf — 5 etapów: raporty, przesłuchania i zadania',
    '03_DOWODY.pdf — 12 dowodów rzeczowych',
    '04_NOTATNIK_DETEKTYWA.pdf — kartoteka, oś czasu i raport końcowy',
    '05_ROZWIAZANIE.pdf — zapieczętowane rozwiązanie (otwórz na końcu!)'
  ],
  $json$[
  {
    "type": "raport",
    "title": "Monitoring świateł",
    "meta": "Urząd Morski w Gdyni",
    "body": "23:41 — zanik zasilania lampy, alarm do latarnika.\n00:06 — przywrócenie zasilania.\n\nLatarnik zwykle zgłasza przyczynę awarii w ciągu godziny. Tym razem nie zadzwonił.",
    "stamp": "UM Gdynia"
  },
  {
    "type": "przesluchanie",
    "title": "Protokół przesłuchania — fragment",
    "meta": "Rybak, sąsiad latarnika",
    "body": "— Co pan widział w nocy?\n— Małe światełko przy wieży, od strony lasu. Potem latarnia zgasła.\n— A potem?\n— Stasiek poszedł do wieży ze swoją wielką latarą. I nie wrócił."
  },
  {
    "type": "notatka",
    "title": "Notatka detektywa",
    "body": "40 lat, 311 awarii, 311 wpisów w dzienniku.\nTej nocy — ani słowa.\nTylko dwie linijki liczb.\n\n→ Tablica szyfrów na ścianie?"
  }
]$json$::jsonb,
  3, 75, 23, 5, 2499,
  true, 6,
  'AKTA #006 — Latarnik | Gra detektywistyczna PDF — śmierć w latarni morskiej',
  'Drukowana gra detektywistyczna: sztorm na Helu, zgaszona latarnia i śmierć latarnika. Ślady butów, szyfr Polibiusza i 5 podejrzanych. Pobierz PDF i rozwiąż sprawę.',
  array[
    'morderstwo'
  ],
  'Hel'
)
on conflict (slug) do nothing;

insert into public.cases (
  slug, case_number, title, tagline, description, highlights, contents, excerpts,
  difficulty, play_time_minutes, page_count, suspect_count, price_grosze,
  is_published, sort_order, seo_title, seo_description, tags, city
) values (
  'ostatni-akord',
  '007',
  'Ostatni akord',
  'Gwiazdor skrzypiec ginie w garderobie w trakcie koncertu. Orkiestra gra dalej.',
  $txt$Jubileuszowy koncert Filharmonii Odrzańskiej. Solista Konrad Wierzbicki zbiera owacje, w przerwie wraca do garderoby — i już z niej nie wychodzi. Obok ciała leży jego własna nagroda, brązowy „Złoty Smyczek”.

Na zaplecze nie wchodzi się z ulicy: jest portiernia, program koncertu z dokładnymi godzinami i dziennik inspicjenta prowadzony co do sekundy. Ktoś z orkiestry kłamie, gdzie był, gdy grały tylko instrumenty dęte.

Elegancka sprawa o muzyce, zazdrości i instrumencie wartym miliony — z szyfrem ukrytym w programie koncertu.$txt$,
  array[
    'Alibi zapisane w programie koncertu — kto był na scenie, a kto nie',
    'Dziennik inspicjenta co do sekundy i zeszyt portiera',
    'Szyfr programowy: wiersz i słowo',
    'Kalafonia, włosie smyczka i ekspertyza lutnicza',
    'Jedno logiczne rozwiązanie'
  ],
  array[
    '01_INSTRUKCJA.pdf — zasady i przebieg śledztwa',
    '02_AKTA_SPRAWY.pdf — 5 etapów: raporty, przesłuchania i zadania',
    '03_DOWODY.pdf — 12 dowodów rzeczowych',
    '04_NOTATNIK_DETEKTYWA.pdf — kartoteka, oś czasu i raport końcowy',
    '05_ROZWIAZANIE.pdf — zapieczętowane rozwiązanie (otwórz na końcu!)'
  ],
  $json$[
  {
    "type": "raport",
    "title": "Notatka z oględzin",
    "meta": "Garderoba solisty",
    "body": "Statuetka „Złoty Smyczek” na dywanie. Odciski starte.\n\nNa krawędzi — biały, drobny pył: kalafonia.\n\nPod toaletką — dwa zerwane białe włosy końskie.",
    "stamp": "Oględziny"
  },
  {
    "type": "przesluchanie",
    "title": "Protokół przesłuchania — fragment",
    "meta": "Adwokat denata",
    "body": "— Jak skończyła się rozmowa?\n— Nagle powiedział: „O, ktoś puka. Wejdź!”\n— I?\n— I rozłączył się. To było tuż po 20:22."
  },
  {
    "type": "notatka",
    "title": "Notatka detektywa",
    "body": "72 muzyków. 1000 widzów.\nJedna portiernia.\nKto chodzi po zapleczu bez przepustki?\n\n→ Program koncertu. Kto wtedy grał?"
  }
]$json$::jsonb,
  4, 90, 23, 5, 2499,
  true, 7,
  'AKTA #007 — Ostatni akord | Gra detektywistyczna PDF — morderstwo w filharmonii',
  'Drukowana gra detektywistyczna: zabójstwo skrzypka w garderobie w trakcie koncertu. Program, dziennik inspicjenta, szyfr i 5 podejrzanych. Pobierz PDF.',
  array[
    'morderstwo',
    'kradziez'
  ],
  'Wrocław'
)
on conflict (slug) do nothing;

insert into public.cases (
  slug, case_number, title, tagline, description, highlights, contents, excerpts,
  difficulty, play_time_minutes, page_count, suspect_count, price_grosze,
  is_published, sort_order, seo_title, seo_description, tags, city
) values (
  'zasypani',
  '008',
  'Zasypani',
  'Śnieżyca odcina pensjonat od świata. Rano właścicielka nie żyje. Mordercą jest ktoś z salonu.',
  $txt$Kościelisko, śnieżyca, zamknięta droga. Siedmioro ludzi gra wieczorem w Tabu, a właścicielka pensjonatu schodzi do sauny. Rano syn znajduje ją martwą. „Lekarz” spośród gości stwierdza zawał.

Ale ktoś zmienił temperaturę na panelu, a na klamce sauny zostały czarne smugi. Masz arkusz punktacji z gry prowadzony co do minuty, pamięć sterownika sauny, szafki w narciarni i zeszyt zapisany lustrzanym pismem — będziesz potrzebować lusterka.

Klasyczna zagadka „zamkniętego kręgu” w zimowej scenerii Tatr.$txt$,
  array[
    'Zamknięty krąg: śnieżyca, zamknięta droga, siedmioro podejrzanych w jednym domu',
    'Arkusz gry w Tabu jako alibi — minuta po minucie',
    'Lustrzane pismo — przygotuj lusterko',
    'Pamięć sterownika sauny, narciarnia i obraz Witkacego',
    'Jedno logiczne rozwiązanie'
  ],
  array[
    '01_INSTRUKCJA.pdf — zasady i przebieg śledztwa',
    '02_AKTA_SPRAWY.pdf — 5 etapów: raporty, przesłuchania i zadania',
    '03_DOWODY.pdf — 10 dowodów rzeczowych',
    '04_NOTATNIK_DETEKTYWA.pdf — kartoteka, oś czasu i raport końcowy',
    '05_ROZWIAZANIE.pdf — zapieczętowane rozwiązanie (otwórz na końcu!)'
  ],
  $json$[
  {
    "type": "raport",
    "title": "Stwierdzenie zgonu",
    "meta": "Oświadczenie gościa pensjonatu",
    "body": "Stwierdzam zgon kobiety lat ok. 70 w kabinie sauny.\n\nPrzyczyna: prawdopodobnie zawał serca w wyniku przegrzania.\n\nBrak śladów przemocy.",
    "stamp": "Kopia"
  },
  {
    "type": "przesluchanie",
    "title": "Protokół przesłuchania — fragment",
    "meta": "Gość z pokoju nr 4",
    "body": "— Jest pan lekarzem?\n— (pauza) Powiedziałem tak rano, bo ktoś musiał przejąć inicjatywę.\n— Więc kim pan jest?\n— Handluję sztuką."
  },
  {
    "type": "notatka",
    "title": "Notatka detektywa",
    "body": "Czarne smugi na klamce sauny.\nDroga zamknięta od 18:00.\nŚnieg wokół domu nietknięty.\n\nMorderca siedział z nami w salonie."
  }
]$json$::jsonb,
  3, 75, 22, 5, 2499,
  true, 8,
  'AKTA #008 — Zasypani | Gra detektywistyczna PDF — morderstwo w zasypanym pensjonacie',
  'Drukowana gra detektywistyczna: śnieżyca odcina pensjonat w Kościelisku, właścicielka ginie w saunie. Lustrzane pismo, arkusz gry i 5 podejrzanych. Pobierz PDF.',
  array[
    'morderstwo'
  ],
  'Kościelisko'
)
on conflict (slug) do nothing;

insert into public.cases (
  slug, case_number, title, tagline, description, highlights, contents, excerpts,
  difficulty, play_time_minutes, page_count, suspect_count, price_grosze,
  is_published, sort_order, seo_title, seo_description, tags, city
) values (
  'anonimy',
  '009',
  'Anonimy',
  'Prezydentka miasta dostaje list z wyciętych liter. Ktoś wie, co zrobiła w 1998 roku.',
  $txt$Trzy tygodnie przed wyborami prezydentka Torunia dostaje anonim sklejony z liter wyciętych z gazety. Autor wie o wydarzeniu z sierpnia 1998 roku i żąda 200 000 zł. Koperta wyszła z ratuszowej frankownicy.

Porównujesz rejestry wejść, pamięć frankownicy, rozdzielnik gazet i wycinki z archiwum. Odczytujesz kod zapisany „jak SMS na starym telefonie”. Każdy w ratuszu ma coś do ukrycia — ale tylko jedna osoba była w budynku przed siódmą rano.

Sprawa bez trupa, za to z tajemnicą sprzed 27 lat i trudnym pytaniem o winę.$txt$,
  array[
    'Szantaż, anonimy z wyciętych liter i tajemnica sprzed 27 lat',
    'Rejestr wejść, pamięć frankownicy i rozdzielnik gazet',
    'Szyfr „starej komórki” i skrytka na dworcu',
    'Wycinek z archiwum gazety z 1998 roku',
    'Jedno logiczne rozwiązanie — bez przemocy'
  ],
  array[
    '01_INSTRUKCJA.pdf — zasady i przebieg śledztwa',
    '02_AKTA_SPRAWY.pdf — 5 etapów: raporty, przesłuchania i zadania',
    '03_DOWODY.pdf — 12 dowodów rzeczowych',
    '04_NOTATNIK_DETEKTYWA.pdf — kartoteka, oś czasu i raport końcowy',
    '05_ROZWIAZANIE.pdf — zapieczętowane rozwiązanie (otwórz na końcu!)'
  ],
  $json$[
  {
    "type": "wycinek",
    "title": "Potrącił rowerzystkę i uciekł",
    "meta": "Gazeta Toruńska · 17 sierpnia 1998",
    "body": "W piątek na Szosie Chełmińskiej czerwony fiat potrącił 17-letnią rowerzystkę. Kierowca nie zatrzymał się.\n\nW niedzielę na komendę zgłosił się 29-letni Leon B."
  },
  {
    "type": "przesluchanie",
    "title": "Protokół przesłuchania — fragment",
    "meta": "Radny opozycji",
    "body": "— Też coś dostałem.\n— Kiedy?\n— W poniedziałek, pocztą, do domu. Koperta z ratuszową opłatą. „Zapytaj ją o 14.08.1998”.\n— Wie pan, o co chodzi?\n— Nie. I trochę się boję."
  },
  {
    "type": "notatka",
    "title": "Notatka detektywa",
    "body": "Litery z gazety, której nie ma w kioskach.\nKoperta z ratuszowej frankownicy.\nOfrankowana o 6:58.\n\n→ Kto przychodzi do pracy przed siódmą?"
  }
]$json$::jsonb,
  3, 75, 24, 5, 2499,
  true, 9,
  'AKTA #009 — Anonimy | Gra detektywistyczna PDF — szantaż w ratuszu',
  'Drukowana gra detektywistyczna: anonimy z wyciętych liter, szantaż prezydentki miasta i tajemnica z 1998 roku. Szyfr, rejestry i 5 podejrzanych. Pobierz PDF.',
  array[
    'szantaz'
  ],
  'Toruń'
)
on conflict (slug) do nothing;

insert into public.cases (
  slug, case_number, title, tagline, description, highlights, contents, excerpts,
  difficulty, play_time_minutes, page_count, suspect_count, price_grosze,
  is_published, sort_order, seo_title, seo_description, tags, city
) values (
  'zaginiona-z-laboratorium',
  '010',
  'Zaginiona z laboratorium',
  'Chemiczka znika razem z formułą wartą miliony. Uciekła — czy ktoś ją wrobił?',
  $txt$Dr Julia Sadowska, kierowniczka tajnego projektu w łódzkim instytucie, przestaje odbierać telefon. Jej auto stoi przy dworcu, a w nocy ktoś jej kartą wchodzi do pracowni i kopiuje dane wynalazku wartego miliony. Dyrektor jest pewien: ukradła formułę i uciekła.

Analizujesz rejestry kart, szlaban parkingu, log serwera i zgłoszenia do IT. Odczytujesz wiadomość zapisaną w języku, który zna tylko jej siostra — liczbami z tablicy Mendelejewa. Musisz odnaleźć Julię i wskazać osobę, która naprawdę ukradła dane.

Sprawa bez trupa: szpiegostwo przemysłowe, zaginięcie i wyścig z czasem.$txt$,
  array[
    'Zaginięcie i szpiegostwo przemysłowe w instytucie naukowym',
    'Szyfr z tablicy Mendelejewa — pełny układ okresowy w dowodach',
    'Rejestry kart, szlaban, log serwera i zgłoszenie do IT',
    'Dwa pytania: gdzie jest Julia i kto ją wrobił?',
    'Jedno logiczne rozwiązanie, wszystkie tropy w aktach'
  ],
  array[
    '01_INSTRUKCJA.pdf — zasady i przebieg śledztwa',
    '02_AKTA_SPRAWY.pdf — 5 etapów: raporty, przesłuchania i zadania',
    '03_DOWODY.pdf — 13 dowodów rzeczowych',
    '04_NOTATNIK_DETEKTYWA.pdf — kartoteka, oś czasu i raport końcowy',
    '05_ROZWIAZANIE.pdf — zapieczętowane rozwiązanie (otwórz na końcu!)'
  ],
  $json$[
  {
    "type": "wiadomosc",
    "title": "Ostatnia wiadomość",
    "meta": "czwartek, 17:52",
    "body": "Ola, muszę zniknąć na kilka dni. Nie szukaj mnie i nie dzwoń.\nWszystko jest na tablicy. Tak jak kiedyś."
  },
  {
    "type": "przesluchanie",
    "title": "Protokół przesłuchania — fragment",
    "meta": "Dyrektor instytutu",
    "body": "— Ona nas okradła, panie komisarzu.\n— Skąd ta pewność?\n— W nocy jej kartą weszła do pracowni i skopiowała wszystko. Konkurencja da jej za to fortunę."
  },
  {
    "type": "notatka",
    "title": "Notatka detektywa",
    "body": "Telefon wyłączony o 19:21.\nKarta w drzwiach o 23:41.\nFartuch na krześle.\n\n→ Kto wiedział, gdzie Julia trzyma kartę?"
  }
]$json$::jsonb,
  4, 90, 24, 5, 2499,
  true, 10,
  'AKTA #010 — Zaginiona z laboratorium | Gra detektywistyczna PDF',
  'Drukowana gra detektywistyczna: zaginiona chemiczka, skradziona formuła i szyfr z tablicy Mendelejewa. Rejestry, logi i 5 podejrzanych. Pobierz PDF.',
  array[
    'zaginiecie',
    'kradziez'
  ],
  'Łódź'
)
on conflict (slug) do nothing;

insert into public.cases (
  slug, case_number, title, tagline, description, highlights, contents, excerpts,
  difficulty, play_time_minutes, page_count, suspect_count, price_grosze,
  is_published, sort_order, seo_title, seo_description, tags, city
) values (
  'czlowiek-za-burta',
  '011',
  'Człowiek za burtą',
  'Nocne regaty na Śniardwach. Szkwał, alarm, zaginiony armator. Wypadek — czy idealna przykrywka?',
  $txt$O 2:14 w nocy jacht „Alba” wzywa pomocy: w szkwale armator wypadł za burtę. Poszukiwania trwają do świtu. Rano rybak znajduje ciało — tylko że zupełnie nie tam, gdzie szukano.

Analizujesz ślad trackera GPS na mapie jeziora z siatką kratek, raport pogodowy, dziennik jachtowy, sekcję zwłok i zapis tętna z zegarka. Odczytujesz wiadomość zapisaną flagami Międzynarodowego Kodu Sygnałowego. Liczy się każda minuta i każda kratka.

Najtrudniejsza sprawa w archiwum — dla doświadczonych detektywów.$txt$,
  array[
    'Najtrudniejsza sprawa w archiwum (poziom 5/5)',
    'Mapa trackera GPS z siatką, wiatrem i dryfem',
    'Szyfr z flag Międzynarodowego Kodu Sygnałowego — pełna karta flag w kolorze',
    'Zapis tętna, sekcja zwłok i oględziny jachtu',
    'Jedno logiczne rozwiązanie, wszystkie tropy w aktach'
  ],
  array[
    '01_INSTRUKCJA.pdf — zasady i przebieg śledztwa',
    '02_AKTA_SPRAWY.pdf — 5 etapów: raporty, przesłuchania i zadania',
    '03_DOWODY.pdf — 14 dowodów rzeczowych',
    '04_NOTATNIK_DETEKTYWA.pdf — kartoteka, oś czasu i raport końcowy',
    '05_ROZWIAZANIE.pdf — zapieczętowane rozwiązanie (otwórz na końcu!)'
  ],
  $json$[
  {
    "type": "raport",
    "title": "Dziennik łączności WOPR",
    "meta": "Kanał 16 · 02:14",
    "body": "Człowiek za burtą, jeden, bez kamizelki. Wypadł ok. 02:10 przy zwrocie w szkwale. Pozycja wg trackera: kratka I4."
  },
  {
    "type": "przesluchanie",
    "title": "Protokół przesłuchania — fragment",
    "meta": "Sterniczka jachtu",
    "body": "— Koło wpół do drugiej obudził mnie łopot żagli. Jacht stanął.\n— I co dalej?\n— Coś stuknęło o pokład. Ktoś zawołał: „Refujemy, śpij!”."
  },
  {
    "type": "notatka",
    "title": "Notatka detektywa",
    "body": "Alarm: I4.\nCiało: D5.\nWiatr: z zachodu.\n\n→ Jak ciało przepłynęło 2,5 km pod wiatr?"
  }
]$json$::jsonb,
  5, 120, 24, 5, 2799,
  true, 11,
  'AKTA #011 — Człowiek za burtą | Najtrudniejsza gra detektywistyczna PDF',
  'Drukowana gra detektywistyczna: nocne regaty na Mazurach, człowiek za burtą, mapa GPS, zapis tętna i szyfr z flag sygnałowych. Poziom 5/5. Pobierz PDF.',
  array[
    'zaginiecie'
  ],
  null
)
on conflict (slug) do nothing;
