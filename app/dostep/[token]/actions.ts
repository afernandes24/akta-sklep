'use server';

import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getOrderByToken } from '@/lib/guest';
import { fulfillOrder } from '@/lib/orders';
import { createAdminClient } from '@/lib/supabase/admin';

/** Przypisuje zakup bez konta do zalogowanego konta (posiadanie linku dostępu = dowód zakupu). */
export async function claimOrder(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const back = `/dostep/${encodeURIComponent(token)}`;
  const user = await getUser();
  if (!user) redirect(`/logowanie?next=${encodeURIComponent(back)}`);

  const order = await getOrderByToken(token);
  if (!order || order.status !== 'paid') redirect(back);
  if (order.user_id && order.user_id !== user.id) redirect(`${back}?blad=inne-konto`);

  if (!order.user_id) {
    await createAdminClient().from('orders').update({ user_id: user.id }).eq('id', order.id).is('user_id', null);
  }
  await fulfillOrder(order.id); // nadaje dostęp na koncie (bezpieczne przy powtórzeniu)
  redirect('/konto/sprawy?info=przypisano');
}
