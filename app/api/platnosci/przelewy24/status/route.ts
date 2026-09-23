import { NextResponse } from 'next/server';
import { fulfillOrder, isUuid } from '@/lib/orders';
import { type P24Notification, verifyP24NotificationSign, verifyP24Transaction } from '@/lib/payments/przelewy24';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Powiadomienie o statusie transakcji z Przelewy24 (urlStatus). */
export async function POST(req: Request) {
  let n: P24Notification;
  try {
    n = (await req.json()) as P24Notification;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe dane' }, { status: 400 });
  }

  if (!n?.sessionId || !isUuid(n.sessionId) || !verifyP24NotificationSign(n)) {
    return NextResponse.json({ error: 'Nieprawidłowy podpis' }, { status: 400 });
  }

  const verified = await verifyP24Transaction(n);
  if (!verified) return NextResponse.json({ error: 'Weryfikacja nieudana' }, { status: 400 });

  const result = await fulfillOrder(n.sessionId, { providerRef: String(n.orderId), paidAmountGrosze: n.amount });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 500 });

  return NextResponse.json({ status: 'OK' });
}
