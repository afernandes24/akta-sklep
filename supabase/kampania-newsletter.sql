-- ═══════════════════════════════════════════════════════════════════
--  KAMPANIE DO NEWSLETTERA + kod „druga sprawa za 0 zł”
--  Uruchom raz w Supabase → SQL Editor (po pliku rabat-druga-sprawa.sql).
-- ═══════════════════════════════════════════════════════════════════

-- Kto dostał którą kampanię (żeby nikt nie dostał tego samego maila dwa razy)
create table if not exists public.newsletter_sends (
  id         bigint generated always as identity primary key,
  campaign   text not null,
  email      text not null,
  sent_at    timestamptz not null default now(),
  unique (campaign, email)
);
alter table public.newsletter_sends enable row level security;
drop policy if exists "newsletter_sends: admin" on public.newsletter_sends;
create policy "newsletter_sends: admin" on public.newsletter_sends
  for all using (public.is_admin()) with check (public.is_admin());

-- Kod: przy 2 sprawach tańsza za 0 zł (ważny 7 dni — zmienisz w Admin → Rabaty)
insert into public.discount_codes (code, second_percent_off, min_items, valid_until, one_per_user, is_active, note)
values ('DRUGAGRATIS', 100, 2, now() + interval '7 days', true, true, 'Newsletter: druga (tańsza) sprawa za 0 zł')
on conflict (code) do nothing;
