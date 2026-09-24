# Wersja online, nagrania i działy — jak to działa

## 1. Wersja online (akta w przeglądarce)

To **te same akta co w PDF**, tylko czytane na ekranie. Nie ma dodatkowej mechaniki gry.
Osobny produkt z własną ceną (`entitlements.format = 'online'`).

**Klient:** Moje sprawy → „▶ Otwórz akta online” → `/online/<slug>`
- zakładki dokumentów (Instrukcja, Akta, Dowody… — to pliki PDF sprawy w tej samej kolejności),
- strony jako obrazy, kliknięcie = powiększenie, strzałki ← → między stronami,
- notatki zapisywane na koncie (`online_reading.notes`),
- plik oznaczony jako „Rozwiązanie” jest **zapieczętowaną kopertą** — otwiera się po potwierdzeniu,
- na stronach widać e-mail klienta (znak wodny),
- zakładka „Nagrania z przesłuchań”, jeśli sprawa je ma.

**Jak włączyć (panel admina → Sprawy → sprawa):**
1. Wgraj pliki PDF (sekcja „Pliki PDF dla kupujących”).
2. Sekcja **Wersja online** → „Wygeneruj z plików PDF” (strony renderują się w Twojej przeglądarce i wgrywają same; nie zamykaj karty).
3. **▶ Podgląd** → sprawdź.
4. **Opublikuj**.
5. W formularzu zaznacz „Sprzedawaj wersję online”, ustaw cenę (puste = jak PDF) → Zapisz.

Po zmianie plików PDF kliknij „Wygeneruj ponownie” — stare strony usuwają się automatycznie.

Technicznie: obrazy stron w prywatnym buckecie `online-pages/<case_id>/v<wersja>/`, spis w `case_online.manifest`,
linki do stron ważne 2 h (wydawane przez serwer tylko posiadaczom wersji online i adminom).

## 2. Nagrania z przesłuchań (AI)

- Dodawane w panelu: Sprawy → sprawa → **Nagrania z przesłuchań** (tytuł, kto jest przesłuchiwany, plik).
- Formaty: MP3, M4A, WAV, OGG (audio) albo MP4, WebM (wideo), do 50 MB. Polecane: MP3 128 kb/s.
- Dostęp: każdy, kto kupił sprawę (PDF **lub** online) — w „Moje sprawy” i w wersji online.
- Plik idzie przez `/api/nagranie/<id>` (sprawdza zakup), bucket `recordings` jest prywatny.
- Sprawa z nagraniami automatycznie dostaje plakietkę 🎧 i trafia do filtra „Z nagraniami przesłuchań”.
- Przy odtwarzaczu i w regulaminie jest informacja, że głosy są wygenerowane przez AI (wymóg przejrzystości).

## 3. Działy, miasta i poziomy

Działy (`cases.tags`, lista w `lib/tags.ts` — nazwy można zmieniać bez migracji):

| id | Nazwa w sklepie | Co |
|---|---|---|
| morderstwo | Krwawe akta | morderstwa |
| katastrofa | Czarna skrzynka | katastrofy i wypadki |
| milosna | Zbrodnie z miłości | miłość, zazdrość, zdrada |
| zaginiecie | Bez śladu | zaginięcia |
| kradziez | Wielki skok | kradzieże i napady |
| szantaz | Brudne sekrety | szantaż, anonimy, afery |
| prl | Archiwum PRL | sprawy z dawnych lat |
| szpiegowska | Ściśle tajne | szpiegostwo i wywiad |
| zimna | Zimne sprawy | stare, nierozwiązane śledztwa |
| rodzinna | Dla całej rodziny | 12+, bez drastycznych scen |

- **📍 Mapa zbrodni** — sprawy z wpisanym miastem (`cases.city`); po kliknięciu pojawia się wybór miasta.
- Dział pokazuje się w katalogu dopiero, gdy ma choć jedną sprawę.
- Poziomy trudności 1–5: Nowicjusz, Posterunkowy, Detektyw, Inspektor, Komisarz.
- Filtr „Dodatki”: 🎧 z nagraniami, 💻 wersja online.
