-- Licznik wysłanych maili — pilnuje limitu Resend (rezerwa na zakupy, równomierny marketing).
-- Uruchom raz w Supabase → SQL Editor.
create table if not exists public.email_log (
  id          bigserial primary key,
  kind        text not null check (kind in ('order', 'system', 'marketing')),
  ok          boolean not null default true,
  status      int,
  created_at  timestamptz not null default now()
);
create index if not exists email_log_created_idx on public.email_log (created_at desc);
alter table public.email_log enable row level security; -- tylko serwer (service_role)

-- sprzątanie: wpisy starsze niż 60 dni nie są potrzebne
delete from public.email_log where created_at < now() - interval '60 days';
