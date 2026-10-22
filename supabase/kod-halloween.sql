-- Kod HALLOWEEN: -25% na całe zamówienie, ważny do końca 2 listopada 2026 (Zaduszki).
-- Baner na stronie głównej pokazuje się, dopóki kod jest aktywny — po terminie znika sam.
-- Uruchom w Supabase → SQL Editor. Termin/zniżkę zmienisz też w Admin → Rabaty.
insert into public.discount_codes (code, percent_off, min_items, valid_until, one_per_user, is_active, note)
values ('HALLOWEEN', 25, 1, '2026-11-02 23:59:59+01', true, true, 'Promocja Halloween — baner na stronie głównej (Pusty grób)')
on conflict (code) do update set
  percent_off = excluded.percent_off, amount_off_grosze = null, min_items = 1,
  valid_until = excluded.valid_until, is_active = true, note = excluded.note;
