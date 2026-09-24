'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { registerRecording } from '@/app/admin/online-actions';
import { safeFileName } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';

const MAX_BYTES = 50 * 1024 * 1024;

function mediaDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const el = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');
    const url = URL.createObjectURL(file);
    const done = (v: number | null) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    el.preload = 'metadata';
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : null);
    el.onerror = () => done(null);
    el.src = url;
  });
}

/** Wgrywanie nagrania przesłuchania (MP3/M4A/WAV/OGG lub MP4/WebM) prosto do bucketu `recordings`. */
export function RecordingUploader({ caseId }: { caseId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get('file') as File | null;
    if (!file || !file.size) return setMsg('Wybierz plik nagrania.');
    if (!/^(audio|video)\//.test(file.type)) return setMsg('To nie jest plik audio ani wideo.');
    if (file.size > MAX_BYTES) return setMsg('Plik jest większy niż 50 MB — zmniejsz go (np. MP3 128 kb/s).');
    setBusy(true);
    setMsg('Wysyłanie…');
    const path = `${caseId}/${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await createClient().storage.from('recordings').upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      setBusy(false);
      return setMsg(`Błąd: ${error.message}`);
    }
    const res = await registerRecording({
      caseId,
      path,
      title: String(fd.get('title') ?? ''),
      person: String(fd.get('person') ?? ''),
      mime: file.type,
      size: file.size,
      duration: await mediaDuration(file),
    });
    setBusy(false);
    setMsg(res.error ? `Błąd: ${res.error}` : 'Dodano ✓');
    if (!res.error) formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-2 rounded-lg border border-dashed border-ink-600 p-3">
      <input name="title" required placeholder="Tytuł, np. Przesłuchanie nr 1" className="input py-1.5 text-xs" />
      <input name="person" placeholder="Kto jest przesłuchiwany (opcjonalnie)" className="input py-1.5 text-xs" />
      <input name="file" type="file" accept="audio/*,video/mp4,video/webm" required className="block w-full text-xs text-paper-200 file:mr-3 file:rounded file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-paper-100" />
      <button disabled={busy} className="btn-secondary w-full py-1.5 text-xs">
        {busy ? 'Wysyłanie…' : 'Dodaj nagranie'}
      </button>
      {msg && (
        <p role="status" className={`text-center text-xs ${msg.startsWith('Błąd') || msg.startsWith('Plik') || msg.startsWith('To nie') ? 'text-stamp-500' : 'text-paper-200'}`}>
          {msg}
        </p>
      )}
    </form>
  );
}
