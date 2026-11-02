-- Automatyczne maile po zakupie — ustawienia w Admin → Maile. Uruchom raz w Supabase → SQL Editor.
alter table public.site_settings add column if not exists followup_auto boolean not null default false;
alter table public.site_settings add column if not exists followup_code text default 'DZIEKUJE30';
alter table public.site_settings add column if not exists followup_days integer not null default 2;
-- Kod do automatu bez daty ważności (żeby nie wygasł); wyłączysz go w Admin → Rabaty
update public.discount_codes set valid_until = null where code = 'DZIEKUJE30';
