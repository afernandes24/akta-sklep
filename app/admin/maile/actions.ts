'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { getPublishedCases } from '@/lib/cases';
import { getBuyers, loadPromo, sendFollowup, type Rec } from '@/lib/followup';

export type MailState = { error?: string; ok?: string };

async function context(formData: FormData) {
  const code = String(formData.get('code') ?? '').trim();
  const promo = code ? await loadPromo(code) : null;
  if (code && !promo) return { error: `Kod ${code.toUpperCase()} nie istnieje, jest wyłączony albo wygasł — sprawdź Admin → Rabaty.` } as const;
  const recs: Rec[] = (await getPublishedCases()).map((c) => ({ slug: c.slug, title: c.title, tagline: c.tagline, price_grosze: c.price_grosze, cover_path: c.cover_path, case_number: c.case_number }));
  return { promo, recs } as const;
}

/** Próbny mail na adres admina (wygląd jak u kupującego ze zgodą na newsletter). */
export async function sendTestMail(_prev: MailState, formData: FormData): Promise<MailState> {
  const { user } = await requireAdmin();
  const ctx = await context(formData);
  if ('error' in ctx) return { error: ctx.error };
  const { buyers } = await getBuyers();
  const sample = buyers[0] ?? { email: user.email!, orderIds: [], pendingOrderIds: [], cases: [], lastPaidAt: '', consentToken: null };
  const ok = await sendFollowup({ ...sample, email: user.email!, consentToken: sample.consentToken ?? 'test' }, ctx.promo, ctx.recs, user.email!);
  return ok ? { ok: `Wysłano próbny mail na ${user.email}.` } : { error: 'Nie udało się wysłać — sprawdź RESEND_API_KEY i EMAIL_FROM w Railway.' };
}

/** Wysyłka do kupujących, którzy jeszcze nie dostali maila (max 60 na jedno kliknięcie). */
export async function sendFollowups(_prev: MailState, formData: FormData): Promise<MailState> {
  await requireAdmin();
  const ctx = await context(formData);
  if ('error' in ctx) return { error: ctx.error };
  const minDays = Math.max(0, parseInt(String(formData.get('min_days') ?? '2'), 10) || 0);
  const { buyers, ready } = await getBuyers();
  if (!ready) return { error: 'Najpierw uruchom w Supabase plik supabase/maile-po-zakupie.sql.' };
  const cutoff = Date.now() - minDays * 864e5;
  const todo = buyers.filter((b) => b.pendingOrderIds.length && new Date(b.lastPaidAt).getTime() <= cutoff).slice(0, 60);
  let sent = 0, failed = 0;
  for (const b of todo) {
    (await sendFollowup(b, ctx.promo, ctx.recs).catch(() => false)) ? sent++ : failed++;
    await new Promise((r) => setTimeout(r, 600)); // limit Resend: ok. 2 maile na sekundę
  }
  revalidatePath('/admin/maile');
  if (!todo.length) return { ok: 'Nie ma nikogo do wysłania — wszyscy kupujący dostali już maila (albo kupili niedawno).' };
  return failed ? { error: `Wysłano ${sent}, nie udało się ${failed}. Spróbuj ponownie za chwilę — wyślą się tylko brakujące.` } : { ok: `Wysłano ${sent} maili.` };
}
