import { FreeCaseUploader } from '@/components/admin/FreeCaseUploader';
import { formatBytes } from '@/lib/format';
import { FREE_CASE, FREE_CASE_FOLDER, listFreeFiles } from '@/lib/newsletter';
import { deleteFreeFile } from '../extra-actions';
import { requireAdmin } from '@/lib/auth';
import { getAdmins } from '@/lib/admins';
import { createAdminClient } from '@/lib/supabase/admin';

async function getCounts() {
  const db = createAdminClient();
  const admins = await getAdmins();
  const full = await db.from('newsletter_subscribers').select('email, status, free_downloads, free_downloaded_at').neq('status', 'pending').limit(50000);
  const res = full.error ? await db.from('newsletter_subscribers').select('email, status').neq('status', 'pending').limit(50000) : full;
  const rows = ((res.data ?? []) as { email: string; free_downloads?: number; free_downloaded_at?: string | null }[]).filter((r) => !admins.emails.has(r.email));
  const weekAgo = Date.now() - 7 * 864e5;
  return {
    tracking: !full.error,
    received: rows.length,
    people: rows.filter((r) => r.free_downloaded_at).length,
    week: rows.filter((r) => r.free_downloaded_at && new Date(r.free_downloaded_at).getTime() >= weekAgo).length,
    files: rows.reduce((s, r) => s + (r.free_downloads ?? 0), 0),
  };
}

export const dynamic = 'force-dynamic';

const KIND = { material: 'materiał', hint: '💡 wskazówki', solution: '🔐 odpowiedzi' } as const;

export default async function AdminFreeCasePage() {
  await requireAdmin(); // każda strona panelu sprawdza uprawnienia sama (layout nie zawsze się wykonuje)
  const [files, n] = await Promise.all([listFreeFiles(), getCounts()]);
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">Darmowa sprawa (newsletter)</h1>
      <p className="mt-2 text-sm text-muted">
        AKTA #{FREE_CASE.number} — {FREE_CASE.title}. Te pliki dostaje każdy, kto potwierdzi zapis na stronie „Za darmo”. Tytuł, opis i punkty na stronie
        /darmowa-sprawa zmieniasz w pliku <code className="text-brass-300">lib/newsletter.ts</code>.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ['Pobrało osób', n.tracking ? String(n.people) : '—'],
          ['W tym tygodniu', n.tracking ? String(n.week) : '—'],
          ['Pobrań plików', n.tracking ? String(n.files) : '—'],
          ['Dostało maila', String(n.received)],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</p>
            <p className="mt-1 font-serif text-3xl font-bold text-paper-50">{value}</p>
          </div>
        ))}
      </div>
      {!n.tracking && <p className="mt-2 text-xs text-stamp-500">Licznik pobrań zacznie działać po uruchomieniu supabase/panel-admina.sql.</p>}

      <ul className="card mt-6 divide-y divide-ink-800">
        {files.length === 0 && <li className="px-5 py-4 text-sm text-stamp-500">Brak plików — link z e-maila nic nie pobierze. Wgraj PDF-y poniżej.</li>}
        {files.map((f) => (
          <li key={f.name} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-mono text-sm text-brass-300">{f.name}</p>
              <p className="text-xs text-muted">
                {KIND[f.kind]} {f.size ? `· ${formatBytes(f.size)}` : ''}
              </p>
            </div>
            <form action={deleteFreeFile}>
              <input type="hidden" name="name" value={f.name} />
              <button className="text-xs text-stamp-500 hover:underline">Usuń</button>
            </form>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <FreeCaseUploader folder={FREE_CASE_FOLDER} />
      </div>
      <p className="mt-3 text-xs text-muted">
        Nazwy z „wskazówki” i „odpowiedzi”/„rozwiązanie” są rozpoznawane automatycznie i pokazywane na końcu listy z ostrzeżeniem. Kolejność — po numerze na
        początku nazwy (np. 01_Instrukcja.pdf).
      </p>
    </div>
  );
}
