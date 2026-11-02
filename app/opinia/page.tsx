import type { Metadata } from 'next';
import Link from 'next/link';
import { checkReviewToken } from '@/lib/followup';
import { createAdminClient } from '@/lib/supabase/admin';
import { LinkReviewForm } from './LinkReviewForm';

export const metadata: Metadata = { title: 'Oceń sprawę', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type Sp = { e?: string; k?: string; s?: string; ocena?: string };

/** Strona z linku w mailu po zakupie: opinia bez logowania (link podpisany dla adresu e-mail). */
export default async function LinkReviewPage({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const email = String(sp.e ?? '').toLowerCase();
  const token = String(sp.k ?? '');
  if (!email || !checkReviewToken(email, token)) {
    return (
      <section className="container-page max-w-xl py-20 text-center">
        <h1 className="text-4xl font-bold">Link wygasł albo jest niepełny</h1>
        <p className="mt-4 text-paper-200">Otwórz link jeszcze raz bezpośrednio z maila. Jeśli masz konto, opinię dodasz też w „Moje sprawy”.</p>
        <Link href="/konto/sprawy" className="btn-secondary mt-6">
          Moje sprawy
        </Link>
      </section>
    );
  }

  const db = createAdminClient();
  const { data: orders } = await db
    .from('orders')
    .select('id, user_id, order_items(case_id, cases(id, slug, title, case_number))')
    .eq('status', 'paid')
    .ilike('email', email.replace(/[%_]/g, ''));
  type O = { id: string; user_id: string | null; order_items: { cases: { id: string; slug: string; title: string; case_number: string } | null }[] };
  const os = (orders ?? []) as unknown as O[];
  const cases = new Map<string, { id: string; slug: string; title: string; case_number: string }>();
  for (const o of os) for (const it of o.order_items ?? []) if (it.cases) cases.set(it.cases.id, it.cases);
  const userIds = [...new Set(os.map((o) => o.user_id).filter(Boolean))] as string[];
  const orderIds = os.map((o) => o.id);
  const or = [userIds.length ? `user_id.in.(${userIds.join(',')})` : null, orderIds.length ? `order_id.in.(${orderIds.join(',')})` : null].filter(Boolean).join(',');
  const { data: reviews } = or ? await db.from('reviews').select('case_id, rating, body, author_name').or(or) : { data: [] };
  const existing = new Map((reviews ?? []).map((r) => [r.case_id as string, r as { rating: number; body: string; author_name: string }]));

  const list = [...cases.values()].sort((a, b) => (a.slug === sp.s ? -1 : b.slug === sp.s ? 1 : a.case_number.localeCompare(b.case_number)));
  const rating = Number(sp.ocena);

  return (
    <section className="container-page max-w-2xl py-12 sm:py-16">
      <p className="eyebrow">Twoja opinia</p>
      <h1 className="mt-2 text-4xl font-bold">Jak poszło śledztwo?</h1>
      <p className="mt-3 text-paper-200">Dziękujemy, że grasz w nasze sprawy. Kilka zdań od ciebie pomoże innym graczom wybrać — i nam pisać lepsze akta.</p>
      <div className="mt-8 space-y-6">
        {list.length === 0 && <p className="text-muted">Nie znaleźliśmy opłaconych zamówień dla tego adresu.</p>}
        {list.map((c, i) => (
          <LinkReviewForm
            key={c.id}
            email={email}
            token={token}
            caseId={c.id}
            title={`AKTA #${c.case_number} — ${c.title}`}
            initialRating={i === 0 && rating >= 1 && rating <= 5 ? rating : undefined}
            existing={existing.get(c.id) ?? null}
          />
        ))}
      </div>
    </section>
  );
}
