import Link from 'next/link';
import { CaseForm } from '@/components/admin/CaseForm';
import { requireAdmin } from '@/lib/auth';

export default async function NewCasePage() {
  await requireAdmin(); // każda strona panelu sprawdza uprawnienia sama (layout nie zawsze się wykonuje)
  return (
    <div className="max-w-4xl">
      <Link href="/admin/sprawy" className="text-sm text-muted hover:text-brass-300">
        ← Wszystkie sprawy
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Nowa sprawa</h1>
      <p className="mt-2 text-sm text-muted">Okładkę, zdjęcia i pliki PDF dodasz po utworzeniu sprawy.</p>
      <div className="mt-8">
        <CaseForm />
      </div>
    </div>
  );
}
