import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteConfig } from '@/lib/config';
import { formatDate } from '@/lib/format';
import { loadThread } from '@/lib/messages';
import { ClientReplyForm } from './ReplyForm';

export const metadata: Metadata = { title: 'Twoja rozmowa', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ClientThreadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await loadThread({ token });
  if (!data) notFound();
  const { thread: t, replies } = data;
  const items = [
    ...(t.message ? [{ id: 'first', author: 'client' as const, body: t.message, created_at: t.created_at }] : []),
    ...replies,
  ];

  return (
    <div className="container-page max-w-2xl py-10">
      <p className="eyebrow">Rozmowa z {siteConfig.name}</p>
      <h1 className="mt-2 font-serif text-3xl font-bold">{t.subject || 'Twoja wiadomość'}</h1>
      <p className="mt-1 text-sm text-muted">Ten link jest tylko dla Ciebie — zachowaj maila, żeby tu wrócić.</p>

      <ol className="mt-8 space-y-3">
        {items.map((m) => (
          <li key={m.id} className={`flex ${m.author === 'client' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                m.author === 'client' ? 'bg-brass-500/15 text-paper-50 ring-1 ring-brass-500/30' : 'bg-ink-800 text-paper-100'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{m.body}</p>
              <p className="mt-1.5 text-right font-mono text-[10px] text-muted">
                {m.author === 'client' ? 'Ty' : siteConfig.name} · {formatDate(m.created_at)}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <section className="card mt-8 p-5">
        <ClientReplyForm token={t.token} />
      </section>
    </div>
  );
}
