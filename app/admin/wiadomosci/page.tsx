import Link from 'next/link';
import { formatDate } from '@/lib/format';
import { listThreads } from '@/lib/messages';
import { StartThreadForm } from './Forms';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  const { ready, threads } = await listThreads();
  const unread = threads.filter((t) => !t.is_read).length;
  return (
    <div className="mt-8 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Wiadomości</h1>
        <p className="mt-1 text-sm text-muted">
          Rozmowy z klientami. Odpowiadasz tutaj, klient dostaje maila i odpisuje na stronie — wszystko zostaje w jednym wątku.
          {unread > 0 && <span className="ml-2 rounded-full bg-stamp-600 px-2 py-0.5 text-xs text-paper-50">{unread} nowe</span>}
        </p>
      </div>

      {!ready && (
        <p className="card p-4 text-sm text-stamp-500">
          Brak tabel rozmów — uruchom w Supabase → SQL Editor plik <code>supabase/wiadomosci-chat.sql</code>.
        </p>
      )}

      <section className="card divide-y divide-ink-800">
        {threads.map((t) => (
          <Link key={t.id} href={`/admin/wiadomosci/${t.id}`} className="flex flex-wrap items-start justify-between gap-2 p-4 hover:bg-ink-900/60">
            <div className="min-w-0">
              <p className={`truncate ${t.is_read ? 'text-paper-200' : 'font-semibold text-paper-50'}`}>
                {!t.is_read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brass-400 align-middle" />}
                {t.subject || 'Bez tematu'}
              </p>
              <p className="text-xs text-muted">
                {t.name} · {t.email}
                {t.started_by === 'admin' && ' · zaczęta przez Ciebie'}
              </p>
            </div>
            <p className="font-mono text-xs text-muted">{formatDate(t.last_activity_at ?? t.created_at)}</p>
          </Link>
        ))}
        {!threads.length && <p className="p-4 text-sm text-muted">Brak wiadomości.</p>}
      </section>

      <section className="card p-6">
        <h2 className="font-serif text-xl font-semibold">Napisz do klienta</h2>
        <p className="mt-1 mb-4 text-sm text-muted">Nowa rozmowa, np. z kimś, kto nie pisał przez formularz. Klient dostanie maila z linkiem, żeby odpisać.</p>
        <StartThreadForm />
      </section>
    </div>
  );
}
