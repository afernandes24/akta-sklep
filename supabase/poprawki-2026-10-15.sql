-- ═══════════════════════════════════════════════════════════════════
--  Poprawki po audycie (15.10.2026) — uruchom raz w Supabase → SQL Editor.
--  Bezpieczne do ponownego uruchomienia.
-- ═══════════════════════════════════════════════════════════════════

-- AKTA #011: tytuł SEO bez absolutnego „najtrudniejsza gra” (trudne do udowodnienia w reklamie)
update public.cases
set seo_title = 'AKTA #011 — Człowiek za burtą | Najtrudniejsza sprawa w naszym archiwum (PDF)'
where slug = 'czlowiek-za-burta'
  and seo_title like '%Najtrudniejsza gra detektywistyczna%';

-- Sprzątanie wiadomości z formularza starszych niż 12 miesięcy (od teraz robi to też sklep przy każdej nowej wiadomości)
delete from public.contact_messages where created_at < now() - interval '12 months';
