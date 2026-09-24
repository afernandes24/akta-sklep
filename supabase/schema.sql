-- ═══════════════════════════════════════════════════════════════════
--  AKTA DETEKTYWA — schemat bazy danych (Supabase / PostgreSQL)
--  Uruchom raz w: Supabase → SQL Editor → New query → Run
--  Skrypt jest idempotentny tam, gdzie to możliwe.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Profile użytkowników ──────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Automatyczne tworzenie profilu po rejestracji
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Czy zalogowany użytkownik jest administratorem?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- ─── Sprawy (produkty) ─────────────────────────────────────────────
create table if not exists public.cases (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  case_number        text not null,
  title              text not null,
  tagline            text not null default '',
  description        text not null default '',
  highlights         text[] not null default '{}',
  contents           text[] not null default '{}',
  excerpts           jsonb not null default '[]'::jsonb,
  difficulty         smallint not null default 3 check (difficulty between 1 and 5),
  play_time_minutes  integer not null default 90 check (play_time_minutes > 0),
  page_count         integer not null default 0 check (page_count >= 0),
  suspect_count      integer not null default 0 check (suspect_count >= 0),
  price_grosze       integer not null check (price_grosze >= 0),
  currency           text not null default 'PLN',
  cover_path         text,
  is_published       boolean not null default false,
  sort_order         integer not null default 0,
  seo_title          text,
  seo_description    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cases_touch on public.cases;
create trigger cases_touch before update on public.cases
  for each row execute function public.touch_updated_at();

-- Zdjęcia / przykładowe strony pokazywane na karcie produktu (publiczne)
create table if not exists public.case_images (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.cases (id) on delete cascade,
  path        text not null,
  caption     text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists case_images_case_idx on public.case_images (case_id, sort_order);

-- Pliki PDF do pobrania po zakupie (prywatne)
create table if not exists public.case_files (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases (id) on delete cascade,
  label         text not null,
  file_name     text not null,
  storage_path  text not null unique,
  size_bytes    bigint,
  is_solution   boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists case_files_case_idx on public.case_files (case_id, sort_order);

-- ─── Zamówienia ────────────────────────────────────────────────────
do $$ begin
  create type public.order_status as enum ('pending', 'paid', 'failed', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        bigint generated always as identity unique,
  user_id             uuid references auth.users (id) on delete set null,
  email               text not null,
  status              public.order_status not null default 'pending',
  total_grosze        integer not null check (total_grosze >= 0),
  currency            text not null default 'PLN',
  provider            text not null,
  provider_ref        text,
  consent_digital_at  timestamptz not null,
  created_at          timestamptz not null default now(),
  paid_at             timestamptz,
  updated_at          timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  case_id       uuid references public.cases (id) on delete set null,
  title         text not null,
  price_grosze  integer not null check (price_grosze >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- Dostęp do zakupionych spraw (kto może pobierać które pliki)
create table if not exists public.entitlements (
  user_id     uuid not null references auth.users (id) on delete cascade,
  case_id     uuid not null references public.cases (id) on delete restrict,
  order_id    uuid references public.orders (id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (user_id, case_id)
);

-- ─── Wiadomości z formularza kontaktowego ──────────────────────────
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
--  Zapisy zamówień i uprawnień wykonuje wyłącznie serwer (service_role).
-- ═══════════════════════════════════════════════════════════════════
alter table public.profiles          enable row level security;
alter table public.cases             enable row level security;
alter table public.case_images       enable row level security;
alter table public.case_files        enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.entitlements      enable row level security;
alter table public.contact_messages  enable row level security;

-- profiles
drop policy if exists "profiles: własny lub admin" on public.profiles;
create policy "profiles: własny lub admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: edycja własnego" on public.profiles;
create policy "profiles: edycja własnego" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Użytkownik może zmienić tylko imię — nigdy flagi is_admin
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- cases
drop policy if exists "cases: opublikowane lub admin" on public.cases;
create policy "cases: opublikowane lub admin" on public.cases
  for select using (is_published or public.is_admin());

drop policy if exists "cases: admin zapis" on public.cases;
create policy "cases: admin zapis" on public.cases
  for all using (public.is_admin()) with check (public.is_admin());

-- case_images
drop policy if exists "case_images: publiczne dla opublikowanych" on public.case_images;
create policy "case_images: publiczne dla opublikowanych" on public.case_images
  for select using (
    public.is_admin()
    or exists (select 1 from public.cases c where c.id = case_id and c.is_published)
  );

drop policy if exists "case_images: admin zapis" on public.case_images;
create policy "case_images: admin zapis" on public.case_images
  for all using (public.is_admin()) with check (public.is_admin());

-- case_files: widoczne tylko dla kupujących i admina
drop policy if exists "case_files: kupujący lub admin" on public.case_files;
create policy "case_files: kupujący lub admin" on public.case_files
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.entitlements e
      where e.case_id = case_files.case_id and e.user_id = auth.uid()
    )
  );

drop policy if exists "case_files: admin zapis" on public.case_files;
create policy "case_files: admin zapis" on public.case_files
  for all using (public.is_admin()) with check (public.is_admin());

-- orders / order_items / entitlements: tylko odczyt własnych
drop policy if exists "orders: własne lub admin" on public.orders;
create policy "orders: własne lub admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "order_items: własne lub admin" on public.order_items;
create policy "order_items: własne lub admin" on public.order_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

drop policy if exists "entitlements: własne lub admin" on public.entitlements;
create policy "entitlements: własne lub admin" on public.entitlements
  for select using (user_id = auth.uid() or public.is_admin());

-- contact_messages: tylko admin
drop policy if exists "contact: admin" on public.contact_messages;
create policy "contact: admin" on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════
--  STORAGE
--  covers    – okładki (publiczne)
--  previews  – przykładowe strony / zdjęcia (publiczne)
--  case-files – PDF-y sprzedawane klientom (PRYWATNE, pobieranie przez
--               jednorazowe, krótko ważne linki generowane przez serwer)
-- ═══════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('covers',     'covers',     true,  10485760,  array['image/jpeg','image/png','image/webp']),
  ('previews',   'previews',   true,  10485760,  array['image/jpeg','image/png','image/webp']),
  ('case-files', 'case-files', false, 209715200, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage: admin zarządza plikami sklepu" on storage.objects;
create policy "storage: admin zarządza plikami sklepu" on storage.objects
  for all to authenticated
  using (bucket_id in ('covers', 'previews', 'case-files') and public.is_admin())
  with check (bucket_id in ('covers', 'previews', 'case-files') and public.is_admin());


-- ═══════════════════════════════════════════════════════════════════
--  ROZSZERZENIA (wrzesień 2026): tagi, rabaty, newsletter, opinie
--  Cały plik można bezpiecznie uruchomić ponownie na istniejącej bazie.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Tagi spraw (filtry w katalogu) ────────────────────────────────
alter table public.cases add column if not exists tags text[] not null default '{}';

-- ─── Rabaty w zamówieniach ─────────────────────────────────────────
alter table public.orders add column if not exists subtotal_grosze integer;
alter table public.orders add column if not exists discount_grosze integer not null default 0;
alter table public.orders add column if not exists discount_code text;
alter table public.orders add column if not exists discount_label text;
alter table public.order_items add column if not exists list_price_grosze integer;

create table if not exists public.discount_codes (
  code               text primary key check (code ~ '^[A-Z0-9_-]{3,32}$'),
  percent_off        smallint check (percent_off between 1 and 100),
  amount_off_grosze  integer check (amount_off_grosze > 0),
  min_items          integer not null default 1 check (min_items >= 1),
  valid_until        timestamptz,
  max_uses           integer check (max_uses > 0),
  used_count         integer not null default 0,
  one_per_user       boolean not null default true,
  is_active          boolean not null default true,
  note               text,
  created_at         timestamptz not null default now(),
  check ((percent_off is null) <> (amount_off_grosze is null))
);

-- Licznik użyć zwiększa serwer po opłaceniu zamówienia
create or replace function public.use_discount_code(p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.discount_codes set used_count = used_count + 1 where code = p_code;
$$;
revoke execute on function public.use_discount_code(text) from public, anon, authenticated;
grant execute on function public.use_discount_code(text) to service_role;

-- ─── Newsletter + darmowa sprawa ───────────────────────────────────
create table if not exists public.newsletter_subscribers (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique check (email = lower(email)),
  status           text not null default 'pending' check (status in ('pending', 'confirmed', 'unsubscribed')),
  token            uuid not null unique default gen_random_uuid(),
  consent_text     text not null,
  consent_at       timestamptz not null default now(),
  confirmed_at     timestamptz,
  unsubscribed_at  timestamptz,
  source           text,
  created_at       timestamptz not null default now()
);

-- ─── Opinie klientów ───────────────────────────────────────────────
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references public.cases (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  body         text not null check (char_length(body) between 10 and 1500),
  author_name  text not null check (char_length(author_name) between 2 and 40),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (case_id, user_id)
);
create index if not exists reviews_case_idx on public.reviews (case_id, status, created_at desc);

drop trigger if exists reviews_touch on public.reviews;
create trigger reviews_touch before update on public.reviews
  for each row execute function public.touch_updated_at();

create or replace view public.case_ratings
with (security_invoker = true) as
  select case_id, round(avg(rating)::numeric, 1) as avg_rating, count(*)::int as review_count
  from public.reviews
  where status = 'approved'
  group by case_id;

alter table public.discount_codes          enable row level security;
alter table public.newsletter_subscribers  enable row level security;
alter table public.reviews                 enable row level security;

drop policy if exists "discount_codes: admin" on public.discount_codes;
create policy "discount_codes: admin" on public.discount_codes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "newsletter: admin" on public.newsletter_subscribers;
create policy "newsletter: admin" on public.newsletter_subscribers
  for all using (public.is_admin()) with check (public.is_admin());

-- Opinie: wszyscy widzą zatwierdzone, autor — swoją, admin — wszystkie.
-- Zapis wykonuje serwer po sprawdzeniu, że autor kupił sprawę.
drop policy if exists "reviews: odczyt" on public.reviews;
create policy "reviews: odczyt" on public.reviews
  for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());

drop policy if exists "reviews: admin" on public.reviews;
create policy "reviews: admin" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.case_ratings to anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════
--  WERSJA ONLINE SPRAW (wrzesień 2026)
--  Każda sprawa może mieć osobny produkt „online” (akta do czytania w przeglądarce).
--  Bezpieczne do ponownego uruchomienia.
-- ═══════════════════════════════════════════════════════════════════

alter table public.cases add column if not exists online_enabled boolean not null default false;
alter table public.cases add column if not exists online_price_grosze integer check (online_price_grosze >= 0);

alter table public.order_items add column if not exists format text not null default 'pdf';
do $$ begin
  alter table public.order_items add constraint order_items_format_chk check (format in ('pdf', 'online'));
exception when duplicate_object then null; end $$;

-- Uprawnienia per wersja: (użytkownik, sprawa, format)
alter table public.entitlements add column if not exists format text not null default 'pdf';
do $$ begin
  alter table public.entitlements add constraint entitlements_format_chk check (format in ('pdf', 'online'));
exception when duplicate_object then null; end $$;
do $$
begin
  if exists (
    select 1 from pg_constraint c
    where c.conrelid = 'public.entitlements'::regclass and c.contype = 'p'
      and array_length(c.conkey, 1) = 2
  ) then
    alter table public.entitlements drop constraint entitlements_pkey;
    alter table public.entitlements add primary key (user_id, case_id, format);
  end if;
end $$;

-- Pliki PDF widzi tylko posiadacz wersji PDF (lub admin)
drop policy if exists "case_files: kupujący lub admin" on public.case_files;
create policy "case_files: kupujący lub admin" on public.case_files
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.entitlements e
      where e.case_id = case_files.case_id and e.user_id = auth.uid() and e.format = 'pdf'
    )
  );

-- Wersja online = te same akta do czytania w przeglądarce (strony PDF jako obrazy).
-- Stare tabele z pierwszego projektu (gra z zadaniami) — usuwane, nie były używane.
drop table if exists public.game_progress;
drop table if exists public.case_games;

-- Spis stron wersji online (generowany w panelu admina z plików PDF sprawy)
create table if not exists public.case_online (
  case_id       uuid primary key references public.cases (id) on delete cascade,
  version       integer not null default 1,
  manifest      jsonb not null,
  is_published  boolean not null default false,
  updated_at    timestamptz not null default now()
);
drop trigger if exists case_online_touch on public.case_online;
create trigger case_online_touch before update on public.case_online
  for each row execute function public.touch_updated_at();

-- Notatki czytelnika i informacja, czy otworzył kopertę z rozwiązaniem
create table if not exists public.online_reading (
  user_id             uuid not null references auth.users (id) on delete cascade,
  case_id             uuid not null references public.cases (id) on delete cascade,
  notes               text not null default '' check (char_length(notes) <= 20000),
  solution_opened_at  timestamptz,
  updated_at          timestamptz not null default now(),
  primary key (user_id, case_id)
);
drop trigger if exists online_reading_touch on public.online_reading;
create trigger online_reading_touch before update on public.online_reading
  for each row execute function public.touch_updated_at();

alter table public.case_online     enable row level security;
alter table public.online_reading  enable row level security;

drop policy if exists "case_online: admin" on public.case_online;
create policy "case_online: admin" on public.case_online
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "online_reading: własne lub admin" on public.online_reading;
create policy "online_reading: własne lub admin" on public.online_reading
  for select using (user_id = auth.uid() or public.is_admin());

-- Strony wersji online (prywatne — serwer wydaje krótko ważne linki)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('online-pages', 'online-pages', false, 10485760, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ═══════════════════════════════════════════════════════════════════
--  NAGRANIA Z PRZESŁUCHAŃ (AI) + MIASTO SPRAWY
-- ═══════════════════════════════════════════════════════════════════
alter table public.cases add column if not exists city text;
alter table public.cases add column if not exists recordings_count integer not null default 0;

create table if not exists public.case_recordings (
  id                uuid primary key default gen_random_uuid(),
  case_id           uuid not null references public.cases (id) on delete cascade,
  title             text not null,
  person            text,
  description       text,
  storage_path      text not null unique,
  mime_type         text not null,
  size_bytes        bigint,
  duration_seconds  integer,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists case_recordings_case_idx on public.case_recordings (case_id, sort_order);

alter table public.case_recordings enable row level security;
drop policy if exists "case_recordings: admin" on public.case_recordings;
create policy "case_recordings: admin" on public.case_recordings
  for all using (public.is_admin()) with check (public.is_admin());

-- Licznik nagrań w sprawie (do plakietki i filtra w katalogu)
create or replace function public.sync_recordings_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare cid uuid := coalesce(new.case_id, old.case_id);
begin
  update public.cases set recordings_count = (select count(*) from public.case_recordings where case_id = cid) where id = cid;
  return null;
end $$;
drop trigger if exists case_recordings_count on public.case_recordings;
create trigger case_recordings_count after insert or delete on public.case_recordings
  for each row execute function public.sync_recordings_count();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recordings', 'recordings', false, 52428800,
        array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'video/mp4', 'video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage: admin zarządza plikami sklepu" on storage.objects;
create policy "storage: admin zarządza plikami sklepu" on storage.objects
  for all to authenticated
  using (bucket_id in ('covers', 'previews', 'case-files', 'online-pages', 'recordings') and public.is_admin())
  with check (bucket_id in ('covers', 'previews', 'case-files', 'online-pages', 'recordings') and public.is_admin());
