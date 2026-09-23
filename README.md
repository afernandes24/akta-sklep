# Akta Detektywa — sklep z grami detektywistycznymi PDF

Next.js 15 + Supabase (baza, konta, pliki) + Stripe lub Przelewy24.

**Ścieżka klienta:** strona główna → katalog → produkt → koszyk → płatność → potwierdzenie → konto → pobranie PDF.

---

## Szybki podgląd (bez konfiguracji)

```bash
npm install
npm run dev
```

Otwórz http://localhost:3000. Bez Supabase sklep pokazuje sprawę pokazową, ale logowanie i zakupy są wyłączone.

---

## Uruchomienie produkcyjne — krok po kroku

### 1. Supabase (baza + pliki + konta)

1. Załóż projekt na https://supabase.com (region: Frankfurt / `eu-central-1`).
2. **SQL Editor → New query** → wklej i uruchom kolejno `supabase/schema.sql`, `supabase/seed.sql` (AKTA #001) i `supabase/seed-cases.sql` (AKTA #002–#011).
3. **Authentication → URL Configuration**
   - Site URL: `https://twoja-domena.pl`
   - Redirect URLs: `https://twoja-domena.pl/auth/callback` (i `http://localhost:3000/auth/callback` do testów)
4. (Zalecane) **Authentication → Emails / SMTP** — podepnij własny SMTP (np. Resend, Brevo), bo wbudowany ma niski limit wysyłki. Przetłumacz szablony maili na polski.
5. **Project Settings → API** — skopiuj URL, `anon` key i `service_role` key.

### 2. Zmienne środowiskowe

Skopiuj `.env.example` → `.env.local` i uzupełnij. **Nie wpisuj kluczy do kodu.**

### 3. Konto admina i pliki spraw (AKTA #001–#011)

1. `npm run dev` → zarejestruj się w sklepie (`/rejestracja`).
2. Nadaj sobie admina i wgraj wszystkie gotowe sprawy (po 5 PDF + 4 przykładowe strony) oraz darmową sprawę próbną AKTA #000:
   ```bash
   npm run seed:files -- --admin twoj@email.pl
   ```
3. Panel admina: `/admin` — sekcja **Gotowość do sprzedaży** pokazuje, czego jeszcze brakuje.

### 4. Test całej ścieżki (tryb testowy płatności)

Z `PAYMENT_PROVIDER=mock`: dodaj sprawę do koszyka → zapłać (test) → pliki pojawiają się w **Moje sprawy** → pobierz.

### 5. Prawdziwe płatności

**Stripe** (zalecane; BLIK, Przelewy24, karty, Apple/Google Pay) — pełna instrukcja krok po kroku: **[STRIPE.md](STRIPE.md)**.

**Przelewy24** (bezpośrednio):
1. `PAYMENT_PROVIDER=przelewy24`, uzupełnij `P24_MERCHANT_ID`, `P24_POS_ID`, `P24_API_KEY` (klucz do raportów), `P24_CRC`.
2. Najpierw przetestuj z `P24_SANDBOX=true`, potem ustaw `false`.
3. Adres powiadomień jest wysyłany automatycznie: `/api/platnosci/przelewy24/status`.

> Integracja P24 jest napisana wg dokumentacji API v1, ale nie była testowana na żywym koncie — sprawdź ją w sandboxie przed startem.

### 6. Wdrożenie (Vercel)

1. Wrzuć projekt na GitHub → https://vercel.com → *Import*.
2. Dodaj zmienne z `.env.local` w *Settings → Environment Variables* (z prawdziwym `NEXT_PUBLIC_SITE_URL`).
3. Deploy. Podepnij domenę.
4. Jeśli chcesz testować na Vercelu w trybie `mock`, ustaw dodatkowo `ALLOW_MOCK_PAYMENTS=true` — **i usuń to przed startem sprzedaży.**

### 7. E-maile z potwierdzeniem zamówienia (wymagane prawem)

Przy sprzedaży PDF klient musi dostać potwierdzenie umowy na e-mail — inaczej zachowuje prawo do zwrotu.
1. Załóż konto na https://resend.com, zweryfikuj domenę.
2. Ustaw `RESEND_API_KEY` i `EMAIL_FROM` (np. `Akta Detektywa <zamowienia@twoja-domena.pl>`).
3. Opcjonalnie: ten sam Resend jako SMTP w Supabase + polskie szablony z `supabase/email-templates.md`.

### 8. Przed startem sprzedaży

- [ ] Uzupełnij dane firmy w **`lib/legal/seller.ts`** — regulamin, polityka prywatności, cookies, zwroty, nota prawna i e-maile zaktualizują się same
- [ ] Skonsultuj dokumenty z prawnikiem/księgową (to solidne szablony, ale nie porada prawna)
- [ ] `PAYMENT_PROVIDER` ≠ `mock`, `ALLOW_MOCK_PAYMENTS=false`
- [ ] Zrób jeden prawdziwy zakup i zwrot

---

## Dokumenty prawne

Strony: `/regulamin`, `/zwroty-i-reklamacje`, `/polityka-prywatnosci`, `/polityka-cookies`, `/nota-prawna`.
Treść: `lib/legal/documents.ts`. Dane sprzedawcy: `lib/legal/seller.ts` (pola do uzupełnienia są podświetlone na stronie).

## Sprzedaż i marketing

| Funkcja | Gdzie | Uwagi |
|---|---|---|
| Rabat ilościowy (2 sprawy −10%, 3+ −20%) | `lib/pricing.ts` | liczy się sam w koszyku, opisany w regulaminie §13 |
| Pakiety tematyczne | `lib/bundles.ts` | katalog i strona główna |
| Kody rabatowe | Admin → **Rabaty** | nie łączą się z rabatem ilościowym |
| Darmowa sprawa za newsletter | `/darmowa-sprawa`, Admin → **Newsletter** | wymaga Resend (e-mail z potwierdzeniem); eksport CSV potwierdzonych adresów |
| Opinie (tylko kupujący) | klient: **Moje sprawy**, admin: **Opinie** | publikacja po akceptacji; średnia ocen w Google (JSON-LD) |
| Filtry katalogu | tematy: `lib/tags.ts`, w sprawie: Admin → Sprawy | temat, poziom, czas, sortowanie |
| Znak wodny w PDF | `lib/watermark.ts` | e-mail + nr zamówienia na każdej stronie przy pobraniu |
| Okładki | `components/case/CoverArt.tsx` | każda sprawa ma własny motyw; wgrana okładka ma pierwszeństwo |

**Po aktualizacji** uruchom ponownie cały `supabase/schema.sql` (bezpieczne — dodaje nowe tabele i kolumny) i `npm run seed:files`.

## Dodawanie kolejnych spraw

Admin → **Sprawy → Nowa sprawa** → wypełnij opis i cenę → Zapisz → wgraj okładkę (3:4), pliki PDF i zdjęcia → zaznacz **Opublikowana**.

- Plik z „rozwiązanie” w nazwie jest automatycznie oznaczany i ukrywany za osobnym przyciskiem na koncie klienta.
- Bez własnej okładki sklep rysuje teczkę z numerem i tytułem.
- Sklep odświeża się w ciągu ~1 minuty.

---

## Bezpieczeństwo — jak to działa

- PDF-y leżą w **prywatnym** buckecie `case-files`. Link do pobrania (`/api/pobierz/[id]`) sprawdza logowanie i zakup, potem przekierowuje na jednorazowy adres ważny 60 s.
- Ceny są liczone na serwerze z bazy — klient nie może ich zmienić w koszyku.
- Dostęp do plików (`entitlements`) nadaje tylko serwer po potwierdzeniu płatności (webhook lub sprawdzenie u operatora). Użytkownik nie może sam go sobie dopisać (RLS).
- Nie da się usunąć sprawy, którą ktoś już kupił — można ją tylko ukryć.
- Checkout zbiera zgodę na natychmiastowe dostarczenie treści cyfrowej (art. 38 pkt 13 ustawy o prawach konsumenta).

## Struktura

```
app/                  strony (App Router)
  sprawy/[slug]       strona produktu (SEO, JSON-LD)
  koszyk/             koszyk + rozpoczęcie płatności
  zamowienie/[id]     potwierdzenie zamówienia
  konto/              konto, historia, moje sprawy
  admin/              panel admina
  api/pobierz/        bezpieczne pobieranie PDF
  api/platnosci/      webhooki Stripe / Przelewy24
components/           komponenty UI
lib/
  payments/           operatorzy płatności (mock, stripe, przelewy24)
  orders.ts           tworzenie i realizacja zamówień
  cases.ts            dane katalogu
supabase/             schema.sql, seed.sql, seed-cases.sql
scripts/              seed-files.mjs (wgrywa wszystkie sprawy do Supabase)
content/              treść spraw: generator PDF + gotowe pliki (content/README.md)
lib/legal/            dokumenty prawne + dane sprzedawcy
```

Nowego operatora płatności dodasz w `lib/payments/` (interfejs `PaymentProvider`).
