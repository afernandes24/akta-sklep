-- Działy (tags) i miasta istniejących spraw — wygenerowane przez content/export.py.
-- Uruchom PO schema.sql. Bezpieczne do ponownego uruchomienia.

update public.cases set tags = array[ 'katastrofa' ], city = 'Lębork' where slug = 'ostatni-lot-sp-krw';
update public.cases set tags = array[ 'katastrofa', 'zaginiecie', 'milosna' ], city = null where slug = 'katastrofa-nad-sniardwami';
update public.cases set tags = array[ 'katastrofa', 'morderstwo' ], city = null where slug = 'nocny-ekspres-baltyk';
update public.cases set tags = array[ 'kradziez', 'rodzinna' ], city = 'Gdańsk' where slug = 'lza-baltyku';
update public.cases set tags = array[ 'morderstwo' ], city = 'Hel' where slug = 'latarnik';
update public.cases set tags = array[ 'morderstwo', 'kradziez' ], city = 'Wrocław' where slug = 'ostatni-akord';
update public.cases set tags = array[ 'morderstwo' ], city = 'Kościelisko' where slug = 'zasypani';
update public.cases set tags = array[ 'szantaz' ], city = 'Toruń' where slug = 'anonimy';
update public.cases set tags = array[ 'zaginiecie', 'kradziez' ], city = 'Łódź' where slug = 'zaginiona-z-laboratorium';
update public.cases set tags = array[ 'zaginiecie' ], city = null where slug = 'czlowiek-za-burta';
