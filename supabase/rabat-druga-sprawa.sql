-- Nowy rodzaj kodu rabatowego: „druga sprawa taniej” (np. tańsza z każdej pary −50%).
-- Uruchom raz w Supabase → SQL Editor. Bezpieczne do ponownego uruchomienia.
alter table public.discount_codes add column if not exists second_percent_off smallint check (second_percent_off between 1 and 100);

-- Stary warunek „albo procent, albo kwota” zamieniamy na „dokładnie jeden rodzaj rabatu”
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.discount_codes'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%(percent_off IS NULL) <> (amount_off_grosze IS NULL)%'
  loop
    execute format('alter table public.discount_codes drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.discount_codes drop constraint if exists discount_codes_one_kind;
alter table public.discount_codes add constraint discount_codes_one_kind
  check (num_nonnulls(percent_off, amount_off_grosze, second_percent_off) = 1);

-- Przykład (odkomentuj, aby od razu dodać kod DRUGA50 na miesiąc):
-- insert into public.discount_codes (code, second_percent_off, min_items, valid_until, one_per_user, note)
-- values ('DRUGA50', 50, 2, now() + interval '30 days', true, 'Druga sprawa −50%');
