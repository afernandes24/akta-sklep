import Link from 'next/link';
import { CaseCover } from '@/components/case/CaseCover';
import { togglePublish } from '../actions';
import { formatPrice } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminCasesPage() {
  const db = createAdminClient();
  const [{ data: cases }, { data: ents }, { data: files }] = await Promise.all([
    db.from('cases').select('id, slug, case_number, title, price_grosze, is_published, cover_path, sort_order').order('sort_order').order('created_at'),
    db.from('entitlements').select('case_id'),
    db.from('case_files').select('case_id'),
  ]);
  const count = (rows: { case_id: string }[] | null, id: string) => (rows ?? []).filter((r) => r.case_id === id).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Sprawy</h1>
        <Link href="/admin/sprawy/nowa" className="btn-primary">
          + Nowa sprawa
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {(cases ?? []).map((c) => (
          <div key={c.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="w-16 shrink-0">
              <CaseCover caseNumber={c.case_number} title={c.title} coverPath={c.cover_path} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow">Akta #{c.case_number}</p>
              <Link href={`/admin/sprawy/${c.id}`} className="font-serif text-xl text-paper-50 hover:text-brass-300">
                {c.title}
              </Link>
              <p className="mt-1 text-xs text-muted">
                {formatPrice(c.price_grosze)} · sprzedano: {count(ents, c.id)} · plików PDF: {count(files, c.id)} · /sprawy/{c.slug}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase ${c.is_published ? 'border-emerald-600/60 text-emerald-300' : 'border-ink-600 text-muted'}`}>
                {c.is_published ? 'Opublikowana' : 'Ukryta'}
              </span>
              <form action={togglePublish}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="publish" value={String(!c.is_published)} />
                <button className="btn-ghost text-xs">{c.is_published ? 'Ukryj' : 'Opublikuj'}</button>
              </form>
              <Link href={`/admin/sprawy/${c.id}`} className="btn-secondary py-2 text-xs">
                Edytuj
              </Link>
            </div>
          </div>
        ))}
        {!cases?.length && <p className="text-muted">Brak spraw. Dodaj pierwszą.</p>}
      </div>
    </div>
  );
}
