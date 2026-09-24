'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth';
import { isUuid } from '@/lib/orders';
import { createAdminClient } from '@/lib/supabase/admin';

export type ReviewState = { error?: string; ok?: boolean };

export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const user = await getUser();
  if (!user) return { error: 'Zaloguj się, aby dodać opinię.' };

  const caseId = String(formData.get('caseId') ?? '');
  const rating = parseInt(String(formData.get('rating') ?? ''), 10);
  const body = String(formData.get('body') ?? '').trim();
  const author = String(formData.get('author') ?? '').trim();

  if (!isUuid(caseId)) return { error: 'Nieprawidłowa sprawa.' };
  if (!(rating >= 1 && rating <= 5)) return { error: 'Wybierz ocenę od 1 do 5 gwiazdek.' };
  if (body.length < 10 || body.length > 1500) return { error: 'Opinia powinna mieć od 10 do 1500 znaków.' };
  if (author.length < 2 || author.length > 40) return { error: 'Podpis powinien mieć od 2 do 40 znaków (np. imię).' };
  if (formData.get('rules') !== 'on') return { error: 'Potwierdź, że opinia jest zgodna z zasadami.' };

  const db = createAdminClient();
  // Opinię może dodać wyłącznie osoba, która kupiła sprawę (weryfikacja po zamówieniu).
  const { data: ent } = await db.from('entitlements').select('case_id').eq('user_id', user.id).eq('case_id', caseId).limit(1);
  if (!ent?.length) return { error: 'Opinię mogą dodać tylko osoby, które kupiły tę sprawę.' };

  const { error } = await db
    .from('reviews')
    .upsert({ case_id: caseId, user_id: user.id, rating, body, author_name: author, status: 'pending' }, { onConflict: 'case_id,user_id' });
  if (error) {
    console.error('[reviews] submit', error.message);
    return { error: 'Nie udało się zapisać opinii. Spróbuj ponownie.' };
  }
  revalidatePath('/konto/sprawy');
  return { ok: true };
}
