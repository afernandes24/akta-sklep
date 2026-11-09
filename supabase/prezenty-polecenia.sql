-- ═══════════════════════════════════════════════════════════════════
--  PREZENTY, KARTY PODARUNKOWE, POLECENIA, KOD ZA OPINIĘ, KOD TYGODNIA
--  Uruchom raz w Supabase → SQL Editor (po newsletter-co-tydzien.sql). Można uruchomić ponownie.
-- ═══════════════════════════════════════════════════════════════════

-- Zamówienie jako prezent (sprawa albo karta podarunkowa) — kto dostaje, kiedy i z jakim liścikiem
alter table public.orders add column if not exists gift_kind        text check (gift_kind in ('case', 'card'));
alter table public.orders add column if not exists gift_to_email    text;
alter table public.orders add column if not exists gift_to_name     text;
alter table public.orders add column if not exists gift_from_name   text;
alter table public.orders add column if not exists gift_message     text;
alter table public.orders add column if not exists gift_send_at     timestamptz;
alter table public.orders add column if not exists gift_sent_at     timestamptz;
alter table public.orders add column if not exists gift_card_grosze integer check (gift_card_grosze > 0);
alter table public.orders add column if not exists gift_card_code   text;
create index if not exists orders_gift_due_idx on public.orders (gift_send_at) where gift_kind is not null and gift_sent_at is null;

-- Kody: karta podarunkowa (saldo), polecenia (czyj kod), nagrody
alter table public.discount_codes add column if not exists is_gift             boolean not null default false;
alter table public.discount_codes add column if not exists gift_balance_grosze integer check (gift_balance_grosze >= 0);
alter table public.discount_codes add column if not exists referrer_email      text;
create unique index if not exists discount_codes_referrer_idx on public.discount_codes (lower(referrer_email)) where referrer_email is not null;

-- Kod za wystawienie opinii (wysyłany automatycznie mailem; zmienisz w Admin → Rabaty)
insert into public.discount_codes (code, percent_off, min_items, valid_until, one_per_user, is_active, note)
values ('ZAOPINIE', 20, 1, null, true, true, 'Nagroda za opinię: −20% na kolejną sprawę')
on conflict (code) do nothing;

-- Newsletter co tydzień: automatyczny kod tygodnia (np. TYDZIEN46: −25% od 2 spraw, do niedzieli)
alter table public.site_settings add column if not exists weekly_percent integer not null default 25;
alter table public.site_settings add column if not exists weekly_min     integer not null default 2;
