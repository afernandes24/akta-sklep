import 'server-only';
import { createHash } from 'crypto';
import type { PaymentProvider } from './types';
import { siteConfig } from '../config';

/**
 * Bezpośrednia integracja z Przelewy24 (REST API v1).
 * Dokumentacja: https://developers.przelewy24.pl/
 * Przed uruchomieniem produkcyjnym przetestuj w sandboxie (P24_SANDBOX=true).
 */
function cfg() {
  const merchantId = Number(process.env.P24_MERCHANT_ID);
  const posId = Number(process.env.P24_POS_ID || process.env.P24_MERCHANT_ID);
  const apiKey = process.env.P24_API_KEY;
  const crc = process.env.P24_CRC;
  if (!merchantId || !posId || !apiKey || !crc) {
    throw new Error('Brak konfiguracji Przelewy24 (P24_MERCHANT_ID, P24_POS_ID, P24_API_KEY, P24_CRC).');
  }
  const base = process.env.P24_SANDBOX === 'false' ? 'https://secure.przelewy24.pl' : 'https://sandbox.przelewy24.pl';
  return { merchantId, posId, apiKey, crc, base };
}

export function p24Sign(payload: Record<string, string | number>): string {
  return createHash('sha384').update(JSON.stringify(payload)).digest('hex');
}

function authHeader(posId: number, apiKey: string) {
  return `Basic ${Buffer.from(`${posId}:${apiKey}`).toString('base64')}`;
}

export const przelewy24Provider: PaymentProvider = {
  id: 'przelewy24',
  label: 'Przelewy24',
  async createCheckout({ order, email, returnUrl }) {
    const { merchantId, posId, apiKey, crc, base } = cfg();
    const sessionId = order.id;
    const amount = order.total_grosze;
    const currency = 'PLN';

    const body = {
      merchantId,
      posId,
      sessionId,
      amount,
      currency,
      description: `Zamówienie nr ${order.order_number} — ${siteConfig.name}`,
      email,
      country: 'PL',
      language: 'pl',
      urlReturn: returnUrl,
      urlStatus: `${siteConfig.url}/api/platnosci/przelewy24/status`,
      timeLimit: 30,
      encoding: 'UTF-8',
      sign: p24Sign({ sessionId, merchantId, amount, currency, crc }),
    };

    const res = await fetch(`${base}/api/v1/transaction/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader(posId, apiKey) },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { data?: { token?: string }; error?: string } | null;
    const token = json?.data?.token;
    if (!res.ok || !token) {
      throw new Error(`Przelewy24: nie udało się zarejestrować transakcji (${res.status} ${json?.error ?? ''})`);
    }
    return { redirectUrl: `${base}/trnRequest/${token}`, providerRef: token };
  },
};

export interface P24Notification {
  merchantId: number;
  posId: number;
  sessionId: string;
  amount: number;
  originAmount: number;
  currency: string;
  orderId: number;
  methodId: number;
  statement: string;
  sign: string;
}

export function verifyP24NotificationSign(n: P24Notification): boolean {
  const { crc } = cfg();
  const expected = p24Sign({
    merchantId: n.merchantId,
    posId: n.posId,
    sessionId: n.sessionId,
    amount: n.amount,
    originAmount: n.originAmount,
    currency: n.currency,
    orderId: n.orderId,
    methodId: n.methodId,
    statement: n.statement,
    crc,
  });
  return expected === n.sign;
}

/** Wymagane przez P24 potwierdzenie transakcji — bez niego środki nie zostaną zaksięgowane. */
export async function verifyP24Transaction(n: P24Notification): Promise<boolean> {
  const { merchantId, posId, apiKey, crc, base } = cfg();
  const res = await fetch(`${base}/api/v1/transaction/verify`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader(posId, apiKey) },
    body: JSON.stringify({
      merchantId,
      posId,
      sessionId: n.sessionId,
      amount: n.amount,
      currency: n.currency,
      orderId: n.orderId,
      sign: p24Sign({ sessionId: n.sessionId, orderId: n.orderId, amount: n.amount, currency: n.currency, crc }),
    }),
  });
  const json = (await res.json().catch(() => null)) as { data?: { status?: string } } | null;
  return res.ok && json?.data?.status === 'success';
}
