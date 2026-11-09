-- ═══════════════════════════════════════════════════════════════════
--  NEWSLETTER CO TYDZIEŃ („Sprawa tygodnia”) — ustawienia w Admin → Maile.
--  Uruchom raz w Supabase → SQL Editor (po kampania-newsletter.sql).
-- ═══════════════════════════════════════════════════════════════════
alter table public.site_settings add column if not exists weekly_auto boolean not null default false;
alter table public.site_settings add column if not exists weekly_code text;
alter table public.site_settings add column if not exists weekly_dow  integer not null default 4;   -- 1 = poniedziałek … 7 = niedziela
alter table public.site_settings add column if not exists weekly_hour integer not null default 18;
