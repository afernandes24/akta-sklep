# Polskie szablony e-maili Supabase

Wklej w **Supabase → Authentication → Emails → Templates**.

## Confirm signup
**Subject:** Potwierdź adres e-mail — Akta Detektywa
```html
<h2>Witaj, detektywie!</h2>
<p>Kliknij poniższy link, aby potwierdzić adres e-mail i aktywować konto:</p>
<p><a href="{{ .ConfirmationURL }}">Potwierdzam adres e-mail</a></p>
<p>Jeśli to nie ty zakładałeś konto, zignoruj tę wiadomość.</p>
```

## Reset password
**Subject:** Ustaw nowe hasło — Akta Detektywa
```html
<h2>Nowe hasło</h2>
<p>Otrzymaliśmy prośbę o zmianę hasła do twojego konta.</p>
<p><a href="{{ .ConfirmationURL }}">Ustaw nowe hasło</a></p>
<p>Jeśli to nie ty — zignoruj tę wiadomość. Twoje hasło pozostanie bez zmian.</p>
```

## Change email address
**Subject:** Potwierdź nowy adres e-mail — Akta Detektywa
```html
<p>Kliknij, aby potwierdzić zmianę adresu e-mail z {{ .Email }} na {{ .NewEmail }}:</p>
<p><a href="{{ .ConfirmationURL }}">Potwierdzam zmianę</a></p>
```

**Wskazówka:** ustaw własny SMTP (np. Resend: Authentication → Emails → SMTP Settings), bo wbudowana poczta Supabase ma bardzo niski limit wysyłki.
