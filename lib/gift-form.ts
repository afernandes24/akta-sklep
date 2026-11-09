import 'server-only';
import { hasImpossibleTld } from './email-typo';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface GiftInput {
  gift_to_email: string;
  gift_to_name: string | null;
  gift_from_name: string | null;
  gift_message: string | null;
  gift_send_at: string;
}

/** Pola „to prezent” z formularza (koszyk / karta podarunkowa). null = zwykły zakup; { error } = błąd do pokazania. */
export function parseGift(formData: FormData, required = false): GiftInput | { error: string } | null {
  if (!required && formData.get('gift') !== 'on') return null;
  const to = String(formData.get('gift_to_email') ?? '').trim().toLowerCase().slice(0, 200);
  if (!EMAIL_RE.test(to) || hasImpossibleTld(to)) return { error: 'Podaj poprawny e-mail osoby, która dostanie prezent.' };
  const txt = (k: string, n: number) => String(formData.get(k) ?? '').trim().slice(0, n) || null;
  // Data wysyłki (czas polski, godz. 8:00); pusta albo dzisiejsza = od razu po płatności
  const raw = String(formData.get('gift_date') ?? '');
  let sendAt = new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T08:00:00+01:00`);
    const max = Date.now() + 120 * 864e5;
    if (Number.isNaN(d.getTime()) || d.getTime() > max) return { error: 'Datę wysyłki prezentu można ustawić najwyżej 4 miesiące naprzód.' };
    if (d.getTime() > Date.now()) sendAt = d;
  }
  return {
    gift_to_email: to,
    gift_to_name: txt('gift_to_name', 60),
    gift_from_name: txt('gift_from_name', 60),
    gift_message: txt('gift_message', 400),
    gift_send_at: sendAt.toISOString(),
  };
}
