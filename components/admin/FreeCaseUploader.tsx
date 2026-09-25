'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { safeFileName } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';

/** Wgrywa PDF-y darmowej sprawy prosto do case-files/<folder>/ (nadpisuje pliki o tej samej nazwie). */
export function FreeCaseUploader({ folder }: { folder: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const errors: string[] = [];
    for (const [i, file] of Array.from(files).entries()) {
      setStatus(`Wysyłanie ${i + 1}/${files.length}: ${file.name}…`);
      const { error } = await createClient()
        .storage.from('case-files')
        .upload(`${folder}/${safeFileName(file.name)}`, file, { contentType: 'application/pdf', upsert: true, cacheControl: '0' });
      if (error) errors.push(`${file.name}: ${error.message}`);
    }
    setBusy(false);
    setStatus(errors.length ? `Błędy: ${errors.join('; ')}` : 'Gotowe ✓');
    if (inputRef.current) inputRef.current.value = '';
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-dashed border-ink-600 p-4">
      <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
        <span className="btn-secondary pointer-events-none">{busy ? 'Wysyłanie…' : 'Dodaj pliki PDF'}</span>
        <span className="text-xs text-muted">Zaznacz wszystkie naraz. Plik o tej samej nazwie zostanie podmieniony.</span>
        <input ref={inputRef} type="file" accept="application/pdf" multiple disabled={busy} className="sr-only" onChange={(e) => onFiles(e.target.files)} />
      </label>
      {status && <p role="status" className={`mt-3 text-center text-xs ${status.startsWith('Błędy') ? 'text-stamp-500' : 'text-paper-200'}`}>{status}</p>}
    </div>
  );
}
