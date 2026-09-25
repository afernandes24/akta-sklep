'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getOnlineSources, saveOnlineManifest } from '@/app/admin/online-actions';
import { renderPdf } from '@/lib/pdf-render';
import { createClient } from '@/lib/supabase/client';
import type { OnlineDocument } from '@/lib/online';

/** Przycisk „Wygeneruj z plików PDF”: renderuje strony w przeglądarce i wgrywa je do bucketu online-pages. */
export function OnlineGenerator({ caseId, hasExisting }: { caseId: string; hasExisting: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ text: string; tone: 'info' | 'ok' | 'error' } | null>(null);
  const [progress, setProgress] = useState(0);

  async function run() {
    setBusy(true);
    setProgress(0);
    setStatus({ text: 'Przygotowuję pliki PDF…', tone: 'info' });
    try {
      const src = await getOnlineSources(caseId);
      if (src.error || !src.sources || !src.version) throw new Error(src.error ?? 'Brak plików.');
      const supabase = createClient();
      const version = src.version;
      const documents: OnlineDocument[] = [];
      for (const [di, s] of src.sources.entries()) {
        const doc: OnlineDocument = { id: `d${di + 1}`, title: s.title, solution: s.solution, hint: s.hint, pages: [] };
        await renderPdf(s.url, async (page, pi, total) => {
          setStatus({ text: `${s.title}: strona ${pi + 1} z ${total} (plik ${di + 1} z ${src.sources!.length})`, tone: 'info' });
          const path = `${caseId}/v${version}/${String(di + 1).padStart(2, '0')}-${String(pi + 1).padStart(3, '0')}.${page.ext}`;
          const { error } = await supabase.storage.from('online-pages').upload(path, page.blob, {
            contentType: page.blob.type,
            upsert: true,
            cacheControl: '31536000',
          });
          if (error) throw new Error(`Wysyłanie strony ${pi + 1}: ${error.message}`);
          doc.pages.push({ path, w: page.w, h: page.h });
          setProgress((di + (pi + 1) / total) / src.sources!.length);
        });
        documents.push(doc);
      }
      setStatus({ text: 'Zapisuję spis stron…', tone: 'info' });
      const res = await saveOnlineManifest(caseId, version, documents);
      if (res.error) throw new Error(res.error);
      setStatus({ text: res.ok ?? 'Gotowe.', tone: 'ok' });
      router.refresh();
    } catch (e) {
      setStatus({ text: `Błąd: ${(e as Error).message}`, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={run} disabled={busy} className="btn-primary w-full text-sm">
        {busy ? 'Generuję…' : hasExisting ? '↻ Wygeneruj ponownie z plików PDF' : 'Wygeneruj z plików PDF'}
      </button>
      {busy && (
        <div className="mt-3 h-1.5 overflow-hidden rounded bg-ink-800" aria-hidden>
          <div className="h-full bg-brass-400 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
      {status && (
        <p role="status" className={`mt-2 text-xs ${status.tone === 'error' ? 'text-stamp-500' : status.tone === 'ok' ? 'text-emerald-400' : 'text-paper-200'}`}>
          {status.text}
        </p>
      )}
      <p className="mt-2 text-xs text-muted">Nie zamykaj karty do końca. Po każdej zmianie plików PDF wygeneruj ponownie.</p>
    </div>
  );
}
