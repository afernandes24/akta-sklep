'use server';

import { isServiceRoleConfigured } from '@/lib/config';
import { notifyOwner } from '@/lib/email';
import { allow, clientIp } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';

export type ContactState = { ok?: boolean; error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Polityka prywatności: wiadomości z formularza trzymamy do 12 miesięcy. */
const RETENTION_MS = 365 * 864e5;

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Pole-pułapka na boty — prawdziwy człowiek go nie widzi.
  if (String(formData.get('website') ?? '')) return { ok: true };

  const name = String(formData.get('name') ?? '').trim().slice(0, 120);
  const email = String(formData.get('email') ?? '').trim().slice(0, 200);
  const subject = String(formData.get('subject') ?? '').trim().slice(0, 200);
  const message = String(formData.get('message') ?? '').trim().slice(0, 5000);

  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return { error: 'Uzupełnij imię, poprawny adres e-mail i wiadomość (min. 10 znaków).' };
  }
  if (!isServiceRoleConfigured()) {
    return { error: 'Formularz nie jest jeszcze podłączony. Napisz do nas bezpośrednio e-mailem.' };
  }
  // Ochrona przed zalewem wiadomości: 5 wiadomości z jednego IP na godzinę.
  if (!allow(`contact:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { error: 'Wysłano zbyt wiele wiadomości. Spróbuj ponownie za godzinę albo napisz do nas e-mailem.' };
  }

  const db = createAdminClient();
  const { error } = await db.from('contact_messages').insert({ name, email, subject: subject || null, message });
  if (error) return { error: 'Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.' };

  // Powiadomienie dla sprzedawcy — reklamację trzeba rozpatrzyć w 14 dni (inaczej uznaje się ją za przyjętą).
  await notifyOwner(
    `Nowa wiadomość: ${subject || 'bez tematu'}`,
    [`Od: ${name} <${email}>`, `Temat: ${subject || '—'}`, message, 'Odpowiedz na tego maila, a odpowiedź trafi do klienta.'],
    email,
  );

  // Sprzątanie wiadomości starszych niż 12 miesięcy (obietnica z polityki prywatności).
  await db.from('contact_messages').delete().lt('created_at', new Date(Date.now() - RETENTION_MS).toISOString());

  return { ok: true };
}
