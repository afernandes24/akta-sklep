-- ═══════════════════════════════════════════════════════════════════
--  PANEL ADMINA (październik 2026) — uruchom raz w Supabase → SQL Editor.
--  Bezpieczne do ponownego uruchomienia.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Mapa miast: współrzędne odwiedzających i kupujących
alter table public.page_views add column if not exists lat real;
alter table public.page_views add column if not exists lon real;
alter table public.orders add column if not exists geo_lat real;
alter table public.orders add column if not exists geo_lon real;

-- 2. Licznik pobrań darmowej sprawy
alter table public.newsletter_subscribers add column if not exists free_downloads integer not null default 0;
alter table public.newsletter_subscribers add column if not exists free_downloaded_at timestamptz;

-- 3. Naprawa polskich znaków w zapisanych miastach (np. „GdaÅsk” → „Gdańsk”)
do $$
declare r record; fixed text;
begin
  for r in select id, city from public.page_views where city ~ '[ÂÃÄÅ]' loop
    begin
      fixed := convert_from(convert_to(r.city, 'LATIN1'), 'UTF8');
      update public.page_views set city = fixed where id = r.id;
    exception when others then null;
    end;
  end loop;
  for r in select id, geo_city as city from public.orders where geo_city ~ '[ÂÃÄÅ]' loop
    begin
      fixed := convert_from(convert_to(r.city, 'LATIN1'), 'UTF8');
      update public.orders set geo_city = fixed where id = r.id;
    exception when others then null;
    end;
  end loop;
end $$;
