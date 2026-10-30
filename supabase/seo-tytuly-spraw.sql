-- Ujednolicone tytuły SEO spraw (max 60 znaków). Uruchom w Supabase → SQL Editor.
-- Format: „Tytuł – gra detektywistyczna do druku | AKTA #00X”, a gdy za długi: „… – gra detektywistyczna PDF | AKTA #00X”.
update public.cases set seo_title = 'Martwi nie wracają – gra detektywistyczna PDF | AKTA #001' where case_number = '001';
update public.cases set seo_title = 'Czarna taśma – gra detektywistyczna do druku | AKTA #002' where case_number = '002';
update public.cases set seo_title = 'Cisza po sezonie – gra detektywistyczna do druku | AKTA #003' where case_number = '003';
update public.cases set seo_title = 'Alarm na wysokości – gra detektywistyczna PDF | AKTA #004' where case_number = '004';
update public.cases set seo_title = 'Kolacja w ciemności – gra detektywistyczna PDF | AKTA #005' where case_number = '005';
update public.cases set seo_title = 'Pusty grób – gra detektywistyczna do druku | AKTA #006' where case_number = '006';
-- Podgląd: select case_number, title, seo_title, length(seo_title) from public.cases order by case_number;
