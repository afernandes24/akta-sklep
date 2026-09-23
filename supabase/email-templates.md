# Polskie szablony e-maili Supabase

Wklej w **Supabase → Authentication → Emails → Templates**.

Linki prowadzą prosto do sklepu (`/auth/callback?token_hash=…`), dzięki czemu działają także wtedy,
gdy klient otworzy maila na innym urządzeniu lub w innej przeglądarce niż ta, w której zakładał konto.
Wymaga ustawienia **Site URL** na adres sklepu (Authentication → URL Configuration).

## Confirm signup
**Subject:** Potwierdź adres e-mail — Akta Detektywa
```html
<h2>Witaj, detektywie!</h2>
<p>Kliknij poniższy link, aby potwierdzić adres e-mail i aktywować konto:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/konto">Potwierdzam adres e-mail</a></p>
<p>Jeśli to nie ty zakładałeś konto, zignoruj tę wiadomość.</p>
```

## Reset password
**Subject:** Ustaw nowe hasło — Akta Detektywa
```html
<h2>Nowe hasło</h2>
<p>Otrzymaliśmy prośbę o zmianę hasła do twojego konta.</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/konto/nowe-haslo">Ustaw nowe hasło</a></p>
<p>Jeśli to nie ty — zignoruj tę wiadomość. Twoje hasło pozostanie bez zmian.</p>
```

## Change email address
**Subject:** Potwierdź nowy adres e-mail — Akta Detektywa
```html
<p>Kliknij, aby potwierdzić zmianę adresu e-mail z {{ .Email }} na {{ .NewEmail }}:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email_change&next=/konto">Potwierdzam zmianę</a></p>
```

**Wskazówka:** ustaw własny SMTP (np. Resend: Authentication → Emails → SMTP Settings), bo wbudowana poczta Supabase ma bardzo niski limit wysyłki.
