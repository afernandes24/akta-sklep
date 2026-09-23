import Link from 'next/link';
import { formatDate } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin';
import { moderateReview } from '../extra-actions';

type Row = {
  id: string;
  rating: number;
  body: string;
  author_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  cases: { title: string; slug: string; case_number: string } | null;
  profiles?: { email: string } | null;
};

const TABS = [
  ['pending', 'Do sprawdzenia'],
  ['approved', 'Opublikowane'],
  ['rejected', 'Odrzucone'],
] as const;

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = TABS.some(([s]) => s === sp.status) ? (sp.status as string) : 'pending';
  const { data, error } = await createAdminClient()
    .from('reviews')
    .select('id, rating, body, author_name, status, created_at, user_id, cases(title, slug, case_number)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <h1 className="text-3xl font-bold">Opinie</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Opinie dodają tylko kupujący. Publikuj wszystkie zgodne z regulaminem — także negatywne. Odrzucaj wyłącznie spoilery, wulgaryzmy, dane osobowe
        i treści niezwiązane ze sprawą (regulamin, §&nbsp;Opinie).
      </p>
      <nav className="mt-6 flex gap-2">
        {TABS.map(([s, label]) => (
          <Link
            key={s}
            href={`/admin/opinie?status=${s}`}
            className={`rounded-md px-3 py-2 text-sm ${status === s ? 'bg-ink-800 text-paper-50' : 'text-paper-200 hover:text-brass-300'}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {error && <p className="mt-6 text-sm text-stamp-500">Błąd: {error.message} — czy uruchomiono aktualny supabase/schema.sql?</p>}
      <ul className="mt-6 space-y-4">
        {rows.map((r) => (
          <li key={r.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-amber-300">{'★'.repeat(r.rating)}<span className="text-ink-600">{'★'.repeat(5 - r.rating)}</span></span>
              <span className="text-muted">
                {r.cases ? `AKTA #${r.cases.case_number} — ${r.cases.title}` : '—'} · {formatDate(r.created_at)}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-paper-100">{r.body}</p>
            <p className="mt-2 text-sm text-muted">Podpis: {r.author_name}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {r.status !== 'approved' && (
                <form action={moderateReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <button name="status" value="approved" className="btn-primary py-2 text-xs">
                    Opublikuj
                  </button>
                </form>
              )}
              {r.status !== 'rejected' && (
                <form action={moderateReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <button name="status" value="rejected" className="btn-secondary py-2 text-xs">
                    Odrzuć
                  </button>
                </form>
              )}
              <form action={moderateReview}>
                <input type="hidden" name="id" value={r.id} />
                <button name="status" value="delete" className="btn-danger py-2 text-xs">
                  Usuń
                </button>
              </form>
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="card p-8 text-center text-muted">Brak opinii w tej kategorii.</li>}
      </ul>
    </div>
  );
}
