import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Nie znaleziono strony', robots: { index: false } };

export default function NotFound() {
  return (
    <section className="container-page flex flex-col items-center py-24 text-center">
      <span className="stamp text-lg">Brak w aktach</span>
      <h1 className="mt-8 text-4xl font-bold sm:text-5xl">Ślad się urywa</h1>
      <p className="mt-4 max-w-md text-paper-200">Tej strony nie ma w naszym archiwum. Może została przeniesiona albo nigdy nie istniała.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/sprawy" className="btn-primary">
          Zobacz sprawy
        </Link>
        <Link href="/" className="btn-secondary">
          Strona główna
        </Link>
      </div>
    </section>
  );
}
