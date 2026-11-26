'use server';

import { revalidatePath } from 'next/cache';
import { loadThread, notifyOwnerReply, UUID_RE } from '@/lib/messages';
import { allow, clientIp } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';

export type ClientReplyState = { ok?: boolean; error?: string };

/** Klient odpisuje w rozmowie (link z maila) — zapis + powiadomienie dla sprzedawcy. */
export async function clientReply(_prev: ClientReplyState, formData: FormData): Promise<ClientReplyState> {
  if (String(formData.get('website') ?? '')) return { ok: true }; // pułapka na boty
  const token = String(formData.get('token') ?? '');
  const body = String(formData.get('body') ?? '').trim().slice(0, 5000);
  if (!UUID_RE.test(token)) return { error: 'Nie znaleziono rozmowy.' };
  if (body.length < 2) return { error: 'Wpisz treść wiadomości.' };
  if (!allow(`reply:${await clientIp()}`, 15, 60 * 60 * 1000)) return { error: 'Wysłano zbyt wiele wiadomości. Spróbuj za godzinę.' };

  const data = await loadThread({ token });
  if (!data) return { error: 'Nie znaleziono rozmowy.' };
  const db = createAdminClient();
  const { error } = await db.from('contact_replies').insert({ message_id: data.thread.id, author: 'client', body });
  if (error) return { error: 'Nie udało się wysłać. Spróbuj ponownie za chwilę.' };
  await db.from('contact_messages').update({ is_read: false, last_activity_at: new Date().toISOString() }).eq('id', data.thread.id);
  await notifyOwnerReply(data.thread, body);
  revalidatePath(`/wiadomosc/${token}`);
  return { ok: true };
}
