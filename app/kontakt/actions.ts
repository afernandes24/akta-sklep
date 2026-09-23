'use server';

import { isServiceRoleConfigured } from '@/lib/config';
import { createAdminClient } from '@/lib/supabase/admin';

export type ContactState = { ok?: boolean; error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const { error } = await createAdminClient().from('contact_messages').insert({ name, email, subject: subject || null, message });
  if (error) return { error: 'Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.' };
  return { ok: true };
}
