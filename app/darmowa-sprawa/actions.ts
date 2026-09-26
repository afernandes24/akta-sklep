'use server';

import { headers } from 'next/headers';
import { isServiceRoleConfigured } from '@/lib/config';
import { NEWSLETTER_CONSENT_TEXT, sendConfirmationEmail, sendFreeCaseEmail } from '@/lib/newsletter';
import { allow, clientIp } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';

export type SubscribeState = { error?: string; ok?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  // Pułapka na boty — prawdziwy użytkownik nie widzi tego pola.
  if (String(formData.get('website') ?? '')) return { ok: true };
  if (!isServiceRoleConfigured()) return { error: 'Zapisy ruszą po podłączeniu bazy danych (tryb demo).' };

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) return { error: 'Podaj poprawny adres e-mail.' };
  if (formData.get('consent') !== 'on') return { error: 'Zaznacz zgodę na newsletter — bez niej nie możemy wysłać sprawy.' };

  // Ochrona przed zasypywaniem cudzej skrzynki mailami: 1 wiadomość na adres na 10 min, 5 zapisów z jednego IP na godzinę.
  if (!allow(`nl-ip:${await clientIp()}`, 5, 60 * 60 * 1000)) return { error: 'Zbyt wiele prób. Spróbuj ponownie za godzinę.' };
  if (!allow(`nl-mail:${email}`, 1, 10 * 60 * 1000)) return { ok: true };

  const source = String(formData.get('source') ?? 'darmowa-sprawa').slice(0, 40);
  const db = createAdminClient();
  // Niepotwierdzone zapisy starsze niż 30 dni usuwamy (tak obiecuje polityka prywatności).
  await db.from('newsletter_subscribers').delete().eq('status', 'pending').lt('consent_at', new Date(Date.now() - 30 * 864e5).toISOString());
  const { data: existing } = await db.from('newsletter_subscribers').select('id, status, token').eq('email', email).maybeSingle();

  let token: string;
  if (existing?.status === 'confirmed') {
    await sendFreeCaseEmail(email, existing.token as string);
    return { ok: true };
  }
  if (existing) {
    const { data, error } = await db
      .from('newsletter_subscribers')
      .update({ status: 'pending', consent_text: NEWSLETTER_CONSENT_TEXT, consent_at: new Date().toISOString(), unsubscribed_at: null, source })
      .eq('id', existing.id)
      .select('token')
      .single();
    if (error) return { error: 'Coś poszło nie tak. Spróbuj ponownie za chwilę.' };
    token = data.token as string;
  } else {
    const ua = (await headers()).get('user-agent')?.slice(0, 200) ?? '';
    const { data, error } = await db
      .from('newsletter_subscribers')
      .insert({ email, consent_text: NEWSLETTER_CONSENT_TEXT, source: `${source}${ua ? ' · ' + ua.split(' ')[0] : ''}` })
      .select('token')
      .single();
    if (error) {
      console.error('[newsletter]', error.message);
      return { error: 'Coś poszło nie tak. Spróbuj ponownie za chwilę.' };
    }
    token = data.token as string;
  }

  const sent = await sendConfirmationEmail(email, token);
  if (!sent) return { error: 'Nie udało się wysłać e-maila. Sprawdź adres albo napisz do nas.' };
  return { ok: true };
}

export async function unsubscribe(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(token) || !isServiceRoleConfigured()) return;
  await createAdminClient()
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('token', token);
}
