-- ═══════════════════════════════════════════════════════════════════
--  ZAKUP BEZ KONTA (październik 2026)
--  Uruchom raz w Supabase → SQL Editor. Bezpieczne do ponownego uruchomienia.
--  Każde zamówienie dostaje tajny token — link /dostep/<token> daje dostęp do plików bez logowania.
-- ═══════════════════════════════════════════════════════════════════
alter table public.orders add column if not exists access_token uuid not null default gen_random_uuid();
create unique index if not exists orders_access_token_idx on public.orders (access_token);
create index if not exists orders_email_idx on public.orders (lower(email));
