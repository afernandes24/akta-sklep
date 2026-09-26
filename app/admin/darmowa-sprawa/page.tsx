import { FreeCaseUploader } from '@/components/admin/FreeCaseUploader';
import { formatBytes } from '@/lib/format';
import { FREE_CASE, FREE_CASE_FOLDER, listFreeFiles } from '@/lib/newsletter';
import { deleteFreeFile } from '../extra-actions';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const KIND = { material: 'materiał', hint: '💡 wskazówki', solution: '🔐 odpowiedzi' } as const;

export default async function AdminFreeCasePage() {
  await requireAdmin(); // każda strona panelu sprawdza uprawnienia sama (layout nie zawsze się wykonuje)
  const files = await listFreeFiles();
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">Darmowa sprawa (newsletter)</h1>
      <p className="mt-2 text-sm text-muted">
        AKTA #{FREE_CASE.number} — {FREE_CASE.title}. Te pliki dostaje każdy, kto potwierdzi zapis na stronie „Za darmo”. Tytuł, opis i punkty na stronie
        /darmowa-sprawa zmieniasz w pliku <code className="text-brass-300">lib/newsletter.ts</code>.
      </p>

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
