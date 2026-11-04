-- ═══════════════════════════════════════════════════════════════════
--  STATYSTYKI: źródło każdego zamówienia (Meta Ads / mail / Google…) + reklamy
--  Uruchom raz w Supabase → SQL Editor. Można uruchomić ponownie — nic się nie zepsuje.
-- ═══════════════════════════════════════════════════════════════════

-- Wejścia: nazwa reklamy (utm_content) i identyfikator kliknięcia (fbclid → fb, gclid → g)
alter table public.page_views add column if not exists utm_content text;
alter table public.page_views add column if not exists click_id text;
create index if not exists page_views_visitor_idx on public.page_views (visitor);

-- Zamówienia: skąd przyszedł kupujący
alter table public.orders add column if not exists src_channel  text;  -- Meta Ads / Mail / Wyszukiwarka / Facebook / Instagram / Bezpośrednio…
alter table public.orders add column if not exists src_source   text;  -- utm_source albo strona, z której przyszedł (fb, ig, google.com…)
alter table public.orders add column if not exists src_medium   text;  -- utm_medium (paid, email…)
alter table public.orders add column if not exists src_campaign text;  -- utm_campaign (meta-listopad, po-zakupie…)
alter table public.orders add column if not exists src_content  text;  -- utm_content (nazwa reklamy)
alter table public.orders add column if not exists src_landing  text;  -- pierwsza odwiedzona strona
alter table public.orders add column if not exists visitor      text;  -- dzienny anonimowy skrót (ten sam co w page_views)
