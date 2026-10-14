-- Ewidencja sprzedaży: data zwrotu zamówienia (zwrot wchodzi do ewidencji na minusie w dniu zwrotu).
-- Uruchom raz w Supabase → SQL Editor (ostatnią linię — tylko raz, przed pierwszą prawdziwą sprzedażą).

alter table public.orders add column if not exists refunded_at timestamptz;

-- Wcześniejsze zwroty: przyjmij datę ostatniej zmiany zamówienia
update public.orders set refunded_at = updated_at where status = 'refunded' and refunded_at is null;

-- Zamówienia bez prawdziwych pieniędzy: płatność testowa Stripe (sk_test) albo gratis.
-- Nie wchodzą do przychodu, limitu ani ewidencji.
alter table public.orders add column if not exists is_test boolean not null default false;

-- Do dziś sklep działał tylko na kluczu sk_test → wszystkie dotychczasowe zamówienia to testy.
-- Uruchom to JEDEN RAZ, przed pierwszą prawdziwą sprzedażą.
update public.orders set is_test = true where created_at < now();
