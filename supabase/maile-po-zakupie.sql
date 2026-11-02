-- ═══════════════════════════════════════════════════════════════════
--  MAILE PO ZAKUPIE + OPINIE BEZ LOGOWANIA (listopad 2026)
--  Uruchom raz w Supabase → SQL Editor. Bezpieczne do ponownego uruchomienia.
-- ═══════════════════════════════════════════════════════════════════

-- Kiedy wysłano mail z podziękowaniem (żeby nikt nie dostał go dwa razy)
alter table public.orders add column if not exists followup_sent_at timestamptz;

-- Opinia z linku w mailu (bez konta) jest przypisana do zamówienia zamiast do konta
alter table public.reviews alter column user_id drop not null;
alter table public.reviews add column if not exists order_id uuid references public.orders (id) on delete set null;
create unique index if not exists reviews_case_order_idx on public.reviews (case_id, order_id) where order_id is not null;
alter table public.reviews drop constraint if exists reviews_owner_chk;
alter table public.reviews add constraint reviews_owner_chk check (user_id is not null or order_id is not null);

-- Kod dla kupujących (zmień procent / termin według uznania; zarządzasz nim w Admin → Rabaty)
insert into public.discount_codes (code, percent_off, min_items, valid_until, one_per_user, is_active, note)
values ('DZIEKUJE30', 30, 1, now() + interval '14 days', true, true, 'Mail z podziękowaniem dla kupujących')
on conflict (code) do nothing;
