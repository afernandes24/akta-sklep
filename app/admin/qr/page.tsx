import { QrForm } from '@/components/admin/QrForm';
import { requireAdmin } from '@/lib/auth';
import { siteConfig } from '@/lib/config';
import { formatDate } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteQrCode } from '../extra-actions';

export const dynamic = 'force-dynamic';

type Qr = { code: string; label: string; target: string; scans: number; last_scan_at: string | null };

export default async function AdminQrPage() {
  await requireAdmin();
  const db = createAdminClient();
  const [{ data, error }, { data: cases }] = await Promise.all([
    db.from('qr_codes').select('code, label, target, scans, last_scan_at').order('code'),
    db.from('cases').select('slug').order('sort_order'),
  ]);
  const codes = (data ?? []) as Qr[];
  const slugs = (cases ?? []).map((c) => c.slug as string);
  const suggestions = [
    '/konto/sprawy',
    '/darmowa-sprawa',
    '/sprawy',
    ...slugs.flatMap((s) => [`/nagrania/${s}`, `/nagrania/${s}#n1`, `/nagrania/${s}#n2`, `/sprawy/${s}`]),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Kody QR</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Kod w PDF-ie prowadzi na <span className="font-mono text-brass-300">{siteConfig.url}/qr/kod</span>, a sklep przekierowuje dalej — cel możesz zmienić w każdej
          chwili bez przerabiania PDF-ów. Kody do nagrań najprościej tworzysz w sprawie: Sprawy → sprawa → Nagrania → „Utwórz kod QR do tego nagrania” — taki kod otwiera nagranie od razu, bez logowania.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-serif text-lg font-semibold">Nowy kod</h2>
        <QrForm suggestions={suggestions} />
        {error && <p className="mt-3 text-sm text-stamp-500">Brak tabeli kodów — uruchom cały plik supabase/schema.sql w Supabase.</p>}
      </section>

      <section className="space-y-3">
        {codes.length === 0 && !error && <p className="text-sm text-muted">Nie ma jeszcze żadnych kodów.</p>}
        {codes.map((q) => (
          <article key={q.code} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-sm text-brass-300">
                {siteConfig.url.replace(/^https?:\/\//, '')}/qr/{q.code}
              </p>
              <p className="text-xs text-muted">
                Skany: <strong className="text-paper-50">{q.scans}</strong>
                {q.last_scan_at ? ` · ostatni ${formatDate(q.last_scan_at)}` : ''}
              </p>
            </div>
            <div className="mt-3">
              <QrForm suggestions={suggestions} initial={q} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
              <a href={`/admin/qr/${q.code}/obraz`} className="text-brass-300 hover:underline">
                ↓ Pobierz PNG
              </a>
              <a href={`/admin/qr/${q.code}/obraz?format=svg`} className="text-brass-300 hover:underline">
                ↓ Pobierz SVG (do Canvy, ostry przy każdym rozmiarze)
              </a>
              <a href={`/qr/${q.code}`} target="_blank" className="text-paper-200 hover:underline">
                Test ↗ (liczy się jako skan)
              </a>
              <form action={deleteQrCode} className="ml-auto">
                <input type="hidden" name="code" value={q.code} />
                <button className="text-stamp-500 hover:underline">Usuń</button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
