# Podpięcie Stripe — krok po kroku

Kod jest gotowy. Potrzebujesz tylko konta Stripe i 3 wartości w zmiennych środowiskowych.

## 1. Konto
1. Załóż konto na https://dashboard.stripe.com/register (kraj: Polska).
2. Uzupełnij dane firmy i konto bankowe (**Settings → Business**). Do tego czasu działa tylko tryb testowy.

## 2. Testy (bez prawdziwych pieniędzy)
1. W panelu Stripe włącz **Test mode** (przełącznik u góry).
2. **Developers → API keys** → skopiuj *Secret key* (`sk_test_…`).
3. W `.env.local`:
   ```
   PAYMENT_PROVIDER=stripe
   STRIPE_SECRET_KEY=sk_test_…
   ```
4. Webhook lokalnie — zainstaluj Stripe CLI (https://docs.stripe.com/stripe-cli) i uruchom:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/platnosci/stripe/webhook
   ```
   Skopiuj wyświetlony `whsec_…` do `STRIPE_WEBHOOK_SECRET`, zrestartuj `npm run dev`.
5. Kup sprawę kartą testową **4242 4242 4242 4242**, dowolna przyszła data, dowolny CVC.
   Pliki powinny pojawić się w **Moje sprawy**, a zamówienie w panelu admina jako „Opłacone”.

## 3. Metody płatności
**Settings → Payment methods** → włącz: **BLIK**, **Przelewy24**, karty, Apple Pay, Google Pay.
Sklep sam pokaże klientowi wszystkie włączone metody (waluta PLN).

## 4. Produkcja
1. Wyłącz *Test mode* → **Developers → API keys** → skopiuj `sk_live_…`.
2. **Developers → Webhooks → Add endpoint**
   - URL: `https://TWOJA-DOMENA/api/platnosci/stripe/webhook`
   - Zdarzenia:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `checkout.session.expired`
     - `charge.refunded`
   - Skopiuj *Signing secret* (`whsec_…`).
3. W Vercel (**Settings → Environment Variables**):
   ```
   PAYMENT_PROVIDER=stripe
   STRIPE_SECRET_KEY=sk_live_…
   STRIPE_WEBHOOK_SECRET=whsec_…
   ALLOW_MOCK_PAYMENTS=false
   ```
4. Redeploy. W panelu admina (`/admin`) sekcja **Gotowość do sprzedaży** powinna mieć same ✓.
5. Zrób jeden prawdziwy zakup za własne pieniądze i zwróć go w Stripe (**Payments → Refund**) — dostęp do plików zostanie automatycznie odebrany.

## 5. Opcjonalnie
- **Faktury od Stripe**: `STRIPE_INVOICES=true` — Stripe wystawi fakturę do każdej płatności i pozwoli klientowi podać NIP (usługa płatna w Stripe). Jeśli korzystasz z Fakturowni/iFirmy, zostaw `false`.
- **Potwierdzenia e-mail od Stripe**: **Settings → Customer emails → Successful payments** — dodatkowe potwierdzenie płatności (sklep i tak wysyła własne potwierdzenie przez Resend).

## Jak to działa
- Cena jest liczona na serwerze z bazy — klient nie może jej zmienić.
- Po płatności Stripe wysyła webhook → zamówienie „Opłacone” → dostęp do plików + e-mail z potwierdzeniem.
- Gdy webhook się spóźni, strona zamówienia sama sprawdzi status płatności w Stripe.
- Nieopłacone sesje wygasają po 60 minutach.
