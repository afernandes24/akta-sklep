import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/format';
import { loadThread, threadUrl } from '@/lib/messages';
import { createAdminClient } from '@/lib/supabase/admin';
import { toggleRead } from '../actions';
import { AdminReplyForm } from '../Forms';

export const dynamic = 'force-dynamic';

export default async function AdminThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadThread({ id });
  if (!data) notFound();
  const { thread: t, replies } = data;
  if (!t.is_read) await createAdminClient().from('contact_messages').update({ is_read: true }).eq('id', t.id);

  const items = [
    ...(t.message ? [{ id: 'first', author: 'client' as const, body: t.message, created_at: t.created_at }] : []),
    ...replies,
  ];

  return (
    <div className="mt-8 max-w-3xl space-y-6">
      <Link href="/admin/wiadomosci" className="text-sm text-brass-300 hover:underline">
        ← Wszystkie wiadomości
      </Link>
      <div>
        <h1 className="font-serif text-2xl font-bold">{t.subject || 'Bez tematu'}</h1>
        <p className="mt-1 text-sm text-muted">
          {t.name} ·{' '}
          <a href={`mailto:${t.email}`} className="text-brass-300 hover:underline">
            {t.email}
          </a>{' '}
          · od {formatDate(t.created_at)} ·{' '}
          <a href={threadUrl(t.token)} target="_blank" rel="noreferrer" className="text-brass-300 hover:underline">
            widok klienta ↗
          </a>
        </p>
      </div>

      <ol className="space-y-3">
        {items.map((m) => (
          <li key={m.id} className={`flex ${m.author === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                m.author === 'admin' ? 'bg-brass-500/15 text-paper-50 ring-1 ring-brass-500/30' : 'bg-ink-800 text-paper-100'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{m.body}</p>
              <p className="mt-1.5 text-right font-mono text-[10px] text-muted">
                {m.author === 'admin' ? 'Ty' : t.name} · {formatDate(m.created_at)}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <section className="card p-5">
        <AdminReplyForm id={t.id} />
      </section>

      <form action={toggleRead}>
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="read" value="0" />
        <button className="btn-ghost min-h-0 py-1 text-xs">Oznacz jako nieprzeczytane</button>
      </form>
    </div>
  );
}
