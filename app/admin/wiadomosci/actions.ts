'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { emailClient, loadThread, UUID_RE } from '@/lib/messages';
import { createAdminClient } from '@/lib/supabase/admin';

export type ReplyState = { ok?: boolean; error?: string; warning?: string };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Twoja odpowiedź w rozmowie — zapis + mail do klienta z linkiem do rozmowy. */
export async function adminReply(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const body = String(formData.get('body') ?? '').trim().slice(0, 5000);
  if (!UUID_RE.test(id)) return { error: 'Nie znaleziono rozmowy.' };
  if (body.length < 2) return { error: 'Wpisz treść odpowiedzi.' };
  const data = await loadThread({ id });
  if (!data) return { error: 'Nie znaleziono rozmowy. Czy uruchomiłeś SQL wiadomosci-chat.sql?' };

  const db = createAdminClient();
  const { error } = await db.from('contact_replies').insert({ message_id: id, author: 'admin', body });
  if (error) return { error: 'Nie udało się zapisać odpowiedzi. Uruchom w Supabase plik wiadomosci-chat.sql.' };
  await db.from('contact_messages').update({ is_read: true, last_activity_at: new Date().toISOString() }).eq('id', id);

  const { thread, replies } = data;
  const history = [
    ...(thread.message ? [{ who: thread.name || 'Ty', body: thread.message }] : []),
    ...replies.map((r) => ({ who: r.author === 'admin' ? 'Akta Detektywa' : thread.name || 'Ty', body: r.body })),
  ];
  const sent = await emailClient(thread, body, history);
  revalidatePath(`/admin/wiadomosci/${id}`);
  revalidatePath('/admin/wiadomosci');
  return sent ? { ok: true } : { ok: true, warning: 'Odpowiedź zapisana, ale mail do klienta się nie wysłał (sprawdź Resend).' };
}

/** Nowa rozmowa zaczęta przez Ciebie (np. do klienta, który nie pisał przez formularz). */
export async function startThread(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  await requireAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200);
  const name = String(formData.get('name') ?? '').trim().slice(0, 120);
  const subject = String(formData.get('subject') ?? '').trim().slice(0, 200);
  const body = String(formData.get('body') ?? '').trim().slice(0, 5000);
  if (!EMAIL_RE.test(email) || !subject || body.length < 2) return { error: 'Uzupełnij e-mail, temat i treść.' };

  const db = createAdminClient();
  const { data, error } = await db
    .from('contact_messages')
    .insert({ name: name || email, email, subject, message: '', is_read: true, started_by: 'admin' })
    .select('id')
    .single();
  if (error || !data) return { error: 'Nie udało się utworzyć rozmowy. Uruchom w Supabase plik wiadomosci-chat.sql.' };
  await db.from('contact_replies').insert({ message_id: data.id, author: 'admin', body });
  const t = await loadThread({ id: data.id });
  if (t) await emailClient(t.thread, body, []);
  revalidatePath('/admin/wiadomosci');
  redirect(`/admin/wiadomosci/${data.id}`);
}

export async function toggleRead(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!UUID_RE.test(id)) return;
  await createAdminClient().from('contact_messages').update({ is_read: formData.get('read') === '1' }).eq('id', id);
  revalidatePath('/admin/wiadomosci');
  revalidatePath('/admin');
}
