'use server';

import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { fulfillOrder, isUuid, markOrderStatus } from '@/lib/orders';
import { mockPaymentsAllowed } from '@/lib/payments/mock';
import { createAdminClient } from '@/lib/supabase/admin';

async function assertMockOrder(orderId: string) {
  if (!mockPaymentsAllowed() || !isUuid(orderId)) throw new Error('Tryb testowy jest wyłączony.');
  const user = await getUser();
  if (!user) redirect('/logowanie');
  const { data: order } = await createAdminClient().from('orders').select('user_id, provider, status').eq('id', orderId).maybeSingle();
  if (!order || order.user_id !== user.id || order.provider !== 'mock') throw new Error('Nie znaleziono zamówienia.');
}

export async function payMock(formData: FormData) {
  const orderId = String(formData.get('orderId'));
  await assertMockOrder(orderId);
  await fulfillOrder(orderId, { providerRef: `mock_${Date.now()}` });
  redirect(`/zamowienie/${orderId}`);
}

export async function cancelMock(formData: FormData) {
  const orderId = String(formData.get('orderId'));
  await assertMockOrder(orderId);
  await markOrderStatus(orderId, 'cancelled');
  redirect('/koszyk?anulowano=1');
}
