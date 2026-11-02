'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { getPublishedCases } from '@/lib/cases';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBuyers, loadPromo, sendDueFollowups, sendFollowup, type Rec } from '@/lib/followup';

export type MailState = { error?: string; ok?: string };

async function promoFrom(formData: FormData) {
  const code = String(formData.get('code') ?? '').trim();
  const promo = code ? await loadPromo(code) : null;
  if (code && !promo) return { error: `Kod ${code.toUpperCase()} nie istnieje, jest wyłączony albo wygasł — sprawdź Admin → Rabaty.` } as const;
  return { promo, code } as const;
}

/** Próbny mail na adres admina — z JEGO zamówieniami, więc mail i strona opinii pokazują te same sprawy. */
export async function sendTestMail(_prev: MailState, formData: FormData): Promise<MailState> {
  const { user } = await requireAdmin();
  const p = await promoFrom(formData);
  if ('error' in p) return { error: p.error };
  const email = user.email!.toLowerCase();
  const { buyers } = await getBuyers({ includeAdmins: true });
  const me = buyers.find((b) => b.email === email);
  if (!me?.cases.length) return { error: 'Na twoim koncie nie ma opłaconego zamówienia — kup dowolną sprawę (np. z kodem na 100%) albo przejrzyj podgląd w wiadomości od asystenta.' };
  const recs: Rec[] = (await getPublishedCases()).map((c) => ({ slug: c.slug, title: c.title, tagline: c.tagline, price_grosze: c.price_grosze, cover_path: c.cover_path, case_number: c.case_number }));
  const ok = await sendFollowup({ ...me, consentToken: me.consentToken ?? 'podglad' }, p.promo, recs, email);
  return ok ? { ok: `Wysłano próbny mail na ${email} (twoje sprawy: ${me.cases.map((c) => c.title).join(', ')}).` } : { error: 'Nie udało się wysłać — sprawdź RESEND_API_KEY i EMAIL_FROM w Railway.' };
}

/** Wysyłka do kupujących, którzy jeszcze nie dostali maila (max 60 na jedno kliknięcie). */
export async function sendFollowups(_prev: MailState, formData: FormData): Promise<MailState> {
  await requireAdmin();
  const p = await promoFrom(formData);
  if ('error' in p) return { error: p.error };
  const days = Math.max(0, parseInt(String(formData.get('min_days') ?? '0'), 10) || 0);
  const r = await sendDueFollowups({ code: p.code, days, limit: 60 });
  revalidatePath('/admin/maile');
  if (!r.ready) return { error: 'Najpierw uruchom w Supabase plik supabase/maile-po-zakupie.sql.' };
  if (!r.sent && !r.failed) return { ok: 'Nie ma nikogo do wysłania — wszyscy kupujący dostali już maila.' };
  const more = r.left ? ` Zostało jeszcze ${r.left} — kliknij ponownie.` : '';
  return r.failed ? { error: `Wysłano ${r.sent}, nie udało się ${r.failed}. Kliknij ponownie — wyślą się tylko brakujące.${more}` } : { ok: `Wysłano ${r.sent} maili.${more}` };
}

/** Ustawienia automatycznej wysyłki po zakupie. */
export async function saveAutoSettings(_prev: MailState, formData: FormData): Promise<MailState> {
  await requireAdmin();
  const auto = formData.get('auto') === 'on';
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const days = Math.min(30, Math.max(0, parseInt(String(formData.get('days') ?? '2'), 10) || 0));
  if (code && !(await loadPromo(code))) return { error: `Kod ${code} nie istnieje, jest wyłączony albo wygasł.` };
  const { error } = await createAdminClient().from('site_settings').update({ followup_auto: auto, followup_code: code || null, followup_days: days }).eq('id', 1);
  if (error) return { error: 'Najpierw uruchom w Supabase plik supabase/maile-automatyczne.sql.' };
  revalidatePath('/admin/maile');
  return { ok: auto ? `Włączone: mail wyjdzie sam ${days} ${days === 1 ? 'dzień' : 'dni'} po zakupie${code ? `, z kodem ${code}` : ''}.` : 'Automatyczne maile wyłączone.' };
}
