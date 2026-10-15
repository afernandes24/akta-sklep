-- ═══════════════════════════════════════════════════════════════════
--  EWIDENCJA SPRZEDAŻY (październik 2026)
--  Uruchom raz w Supabase → SQL Editor. Bezpieczne do ponownego uruchomienia.
--  Sklep sam dopisuje wpisy: sprzedaż w dniu płatności, zwrot (kwota ujemna) w dniu zwrotu.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.sales_ledger (
  id             bigint generated always as identity primary key,
  order_id       uuid not null references public.orders (id) on delete restrict,
  order_number   bigint,
  kind           text not null check (kind in ('sale', 'refund')),
  amount_grosze  integer not null,
  occurred_at    timestamptz not null default now(),
  entry_date     date not null,
  created_at     timestamptz not null default now(),
  unique (order_id, kind)
);
create index if not exists sales_ledger_date_idx on public.sales_ledger (entry_date);

alter table public.sales_ledger enable row level security;
drop policy if exists "sales_ledger: admin odczyt" on public.sales_ledger;
create policy "sales_ledger: admin odczyt" on public.sales_ledger
  for select using (public.is_admin());

-- Uzupełnienie wstecz: zamówienia opłacone przed włączeniem ewidencji
insert into public.sales_ledger (order_id, order_number, kind, amount_grosze, occurred_at, entry_date)
select id, order_number, 'sale', total_grosze, paid_at, (paid_at at time zone 'Europe/Warsaw')::date
from public.orders
where paid_at is not null and total_grosze > 0 and status in ('paid', 'refunded')
on conflict (order_id, kind) do nothing;

-- …i zwroty (data zwrotu = ostatnia zmiana zamówienia)
insert into public.sales_ledger (order_id, order_number, kind, amount_grosze, occurred_at, entry_date)
select id, order_number, 'refund', -total_grosze, updated_at, (updated_at at time zone 'Europe/Warsaw')::date
from public.orders
where paid_at is not null and total_grosze > 0 and status = 'refunded'
on conflict (order_id, kind) do nothing;
