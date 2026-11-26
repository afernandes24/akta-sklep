-- Wiadomości jako rozmowa (chat): odpowiadasz klientowi z panelu, klient odpisuje przez link na stronie.
-- Uruchom raz w Supabase → SQL Editor.
alter table public.contact_messages add column if not exists token uuid not null default gen_random_uuid();
create unique index if not exists contact_messages_token_idx on public.contact_messages (token);
alter table public.contact_messages add column if not exists last_activity_at timestamptz;
update public.contact_messages set last_activity_at = created_at where last_activity_at is null;
alter table public.contact_messages alter column last_activity_at set default now();
alter table public.contact_messages alter column last_activity_at set not null;
alter table public.contact_messages add column if not exists started_by text not null default 'client';

create table if not exists public.contact_replies (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references public.contact_messages (id) on delete cascade,
  author      text not null check (author in ('admin', 'client')),
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists contact_replies_thread_idx on public.contact_replies (message_id, created_at);
-- Dostęp tylko z serwera (service_role) — brak polityk = nikt z przeglądarki nie czyta
alter table public.contact_replies enable row level security;
