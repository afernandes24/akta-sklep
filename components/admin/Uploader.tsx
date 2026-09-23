'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { registerUpload } from '@/app/admin/actions';
import { safeFileName } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';

const BUCKETS = { cover: 'covers', preview: 'previews', file: 'case-files' } as const;

interface Props {
  caseId: string;
  kind: 'cover' | 'preview' | 'file';
  accept: string;
  multiple?: boolean;
  label: string;
  hint?: string;
}

/**
 * Wgrywa pliki z przeglądarki bezpośrednio do Supabase Storage (omija limity
 * rozmiaru zapytań serwera), a potem rejestruje je w bazie przez akcję serwera.
 */
export function Uploader({ caseId, kind, accept, multiple, label, hint }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const supabase = createClient();
    const errors: string[] = [];

    for (const [i, file] of Array.from(files).entries()) {
      setStatus(`Wysyłanie ${i + 1}/${files.length}: ${file.name}…`);
      const path = `${caseId}/${Date.now()}-${safeFileName(file.name)}`;
      const { error } = await supabase.storage.from(BUCKETS[kind]).upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
        cacheControl: kind === 'file' ? '0' : '31536000',
      });
      if (error) {
        errors.push(`${file.name}: ${error.message}`);
        continue;
      }
      const res = await registerUpload({ caseId, kind, path, fileName: file.name, size: file.size });
      if (res.error) errors.push(`${file.name}: ${res.error}`);
    }

    setBusy(false);
    setStatus(errors.length ? `Błędy: ${errors.join('; ')}` : 'Gotowe ✓');
    if (inputRef.current) inputRef.current.value = '';
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-dashed border-ink-600 p-4">
      <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
        <span className="btn-secondary pointer-events-none">{busy ? 'Wysyłanie…' : label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={busy}
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>
      {status && (
        <p role="status" className={`mt-3 text-center text-xs ${status.startsWith('Błędy') ? 'text-stamp-500' : 'text-paper-200'}`}>
          {status}
        </p>
      )}
    </div>
  );
}
