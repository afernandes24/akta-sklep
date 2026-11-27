import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { alertOrderMailFailed } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase/admin';
import { telegram } from '@/lib/telegram';
import { siteConfig } from '@/lib/config';

/**
 * Webhook Resend: mail odbity / nie dostarczony.
 *  • mail z plikami (rodzaj „order”) → ❗ powiadomienie na Telegram
 *  • odbity adres z newslettera → wypisujemy go (nie marnuje limitu maili)
 * Ustawienie: Resend → Webhooks → Add endpoint: https://aktadetektywa.pl/api/resend-webhook,
 * zdarzenia: email.bounced, email.failed (+ opcjonalnie email.delivery_delayed),
 * a „Signing secret” (whsec_…) wpisz w Railway jako RESEND_WEBHOOK_SECRET.
 */
function verify(body: string, headers: Headers, secret: string) {
  const id = headers.get('svix-id');
  const ts = headers.get('svix-timestamp');
  const sigs = headers.get('svix-signature');
  if (!id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 5 * 60) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest();
  return sigs.split(' ').some((part) => {
    const sig = Buffer.from(part.split(',')[1] ?? '', 'base64');
    return sig.length === expected.length && timingSafeEqual(sig, expected);
  });
}

type Payload = {
  type?: string;
  data?: { to?: string[] | string; subject?: string; tags?: Record<string, string> | { name: string; value: string }[]; bounce?: { message?: string; type?: string }; failed?: { reason?: string } };
};

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: 'brak RESEND_WEBHOOK_SECRET' }, { status: 503 });
  const body = await req.text();
  if (!verify(body, req.headers, secret)) return NextResponse.json({ ok: false }, { status: 401 });

  let p: Payload;
  try {
    p = JSON.parse(body) as Payload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const type = p.type ?? '';
  if (!['email.bounced', 'email.failed', 'email.delivery_delayed'].includes(type)) return NextResponse.json({ ok: true });

  const to = (Array.isArray(p.data?.to) ? p.data?.to[0] : p.data?.to) ?? '';
  const subject = p.data?.subject ?? '';
  const tags = p.data?.tags;
  const kind = Array.isArray(tags) ? tags.find((t) => t.name === 'kind')?.value : tags?.kind;
  const isOrder = kind === 'order' || /Twoje akta są gotowe|Karta podarunkowa|prezent/i.test(subject);
  const reason =
    type === 'email.delivery_delayed'
      ? 'dostarczenie opóźnione (skrzynka klienta nie przyjmuje — Resend jeszcze próbuje)'
      : p.data?.bounce?.message || p.data?.failed?.reason || (type === 'email.bounced' ? 'adres odrzucił maila (np. literówka albo pełna skrzynka)' : 'nie wysłano');

  if (isOrder) {
    const number = subject.match(/nr\s+(\S+)/)?.[1] ?? null;
    let link: string | undefined;
    if (number) {
      const { data } = await createAdminClient().from('orders').select('access_token, user_id').eq('order_number', number).maybeSingle();
      if (data?.access_token && !data.user_id) link = `${siteConfig.url}/dostep/${data.access_token}`;
    }
    await alertOrderMailFailed({ number, email: to, link, reason });
  } else if (type === 'email.bounced' && to) {
    // Odbity adres — nie wysyłamy na niego więcej (oszczędza limit)
    await createAdminClient().from('newsletter_subscribers').update({ status: 'unsubscribed' }).eq('email', to.toLowerCase());
  } else if (type === 'email.failed') {
    await telegram('⚠️ Mail nie wyszedł', [`${to} · „${subject}”`, reason]);
  }
  return NextResponse.json({ ok: true });
}
