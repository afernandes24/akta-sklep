import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CaseForm } from '@/components/admin/CaseForm';
import { OnlineGenerator } from '@/components/admin/OnlineGenerator';
import { RecordingUploader } from '@/components/admin/RecordingUploader';
import { Uploader } from '@/components/admin/Uploader';
import { CaseCover } from '@/components/case/CaseCover';
import { Notice } from '@/components/ui/PageHeader';
import { deleteCase, deleteFile, deleteImage, removeCover, updateFile, updateImage } from '../../actions';
import { CASE_COLUMNS, normalizeCase } from '@/lib/cases';
import { publicStorageUrl } from '@/lib/config';
import { formatBytes, formatDuration } from '@/lib/format';
import type { OnlineManifest, Recording } from '@/lib/online';
import { deleteRecording, setOnlinePublished, updateRecording } from '../../online-actions';
import { isUuid } from '@/lib/orders';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CaseFile, CaseImage } from '@/lib/types';

export default async function EditCasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nowa?: string; blad?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();

  const db = createAdminClient();
  const [{ data: row }, { data: files }, { data: images }, { data: online }, { data: recs }] = await Promise.all([
    db.from('cases').select(CASE_COLUMNS).eq('id', id).maybeSingle(),
    db.from('case_files').select('*').eq('case_id', id).order('sort_order').order('file_name'),
    db.from('case_images').select('*').eq('case_id', id).order('sort_order'),
    db.from('case_online').select('manifest, version, is_published, updated_at').eq('case_id', id).maybeSingle(),
    db.from('case_recordings').select('*').eq('case_id', id).order('sort_order').order('created_at'),
  ]);
  if (!row) notFound();
  const c = normalizeCase(row);
  const manifest = (online?.manifest as OnlineManifest | undefined) ?? null;
  const onlinePages = manifest?.documents.reduce((n, d) => n + d.pages.length, 0) ?? 0;
  const recordings = (recs ?? []) as Recording[];

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_380px]">
      <div className="min-w-0">
        <Link href="/admin/sprawy" className="text-sm text-muted hover:text-brass-300">
          ← Wszystkie sprawy
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">
            #{c.case_number} {c.title}
          </h1>
          <Link href={`/sprawy/${c.slug}`} target="_blank" className="text-sm text-brass-300 hover:underline">
            Zobacz w sklepie ↗
          </Link>
        </div>
        {sp.nowa && (
          <div className="mt-4">
            <Notice tone="success">Sprawa utworzona. Dodaj teraz okładkę i pliki PDF, a potem ją opublikuj.</Notice>
          </div>
        )}
        {sp.blad === 'sprzedana' && (
          <div className="mt-4">
            <Notice tone="error">Tej sprawy nie można usunąć, bo została już kupiona. Zamiast tego ją ukryj.</Notice>
          </div>
        )}
        <div className="mt-8">
          <CaseForm c={c} />
        </div>
      </div>

      <aside className="space-y-8">
        {/* OKŁADKA */}
        <section className="card p-5">
          <h2 className="font-serif text-lg font-semibold">Okładka</h2>
          <div className="mx-auto mt-4 w-44">
            <CaseCover caseNumber={c.case_number} title={c.title} coverPath={c.cover_path} />
          </div>
          <p className="mt-3 text-center text-xs text-muted">{c.cover_path ? 'Własna grafika' : 'Automatyczna okładka (teczka)'}</p>
          <div className="mt-4">
            <Uploader caseId={c.id} kind="cover" accept="image/jpeg,image/png,image/webp" label="Wgraj okładkę" hint="JPG/PNG/WEBP, proporcje 3:4, np. 1200×1600 px" />
          </div>
          {c.cover_path && (
            <form action={removeCover} className="mt-3 text-center">
              <input type="hidden" name="caseId" value={c.id} />
              <button className="text-xs text-stamp-500 hover:underline">Usuń okładkę</button>
            </form>
          )}
        </section>

        {/* PLIKI PDF */}
        <section className="card p-5">
          <h2 className="font-serif text-lg font-semibold">Pliki PDF dla kupujących</h2>
          <p className="mt-1 text-xs text-muted">Prywatne — dostępne tylko po zakupie. Pliki z „odpowiedzi”/„rozwiązanie” i „wskazówki” w nazwie są oznaczane automatycznie.</p>
          <ul className="mt-4 space-y-3">
            {((files ?? []) as CaseFile[]).map((f) => (
              <li key={f.id} className={`rounded-lg border p-3 ${f.is_solution ? 'border-stamp-500/50' : 'border-ink-700'}`}>
                <form action={updateFile} className="space-y-2">
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="caseId" value={c.id} />
                  <input name="file_name" defaultValue={f.file_name} className="input py-1.5 font-mono text-xs" aria-label="Nazwa pliku przy pobieraniu" />
                  <input name="label" defaultValue={f.label} className="input py-1.5 text-xs" aria-label="Opis pliku" />
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5">
                      Kolejność
                      <input name="sort_order" type="number" defaultValue={f.sort_order} className="input w-16 py-1 text-xs" />
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" name="is_solution" defaultChecked={f.is_solution} className="accent-stamp-500" />
                      Rozwiązanie
                    </label>
                    <span className="text-muted">{formatBytes(f.size_bytes)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary min-h-0 flex-1 py-1.5 text-xs">Zapisz</button>
                    <a href={`/api/pobierz/${f.id}`} className="btn-ghost min-h-0 py-1.5 text-xs">
                      Podgląd
                    </a>
                  </div>
                </form>
                <form action={deleteFile} className="mt-2 text-right">
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="caseId" value={c.id} />
                  <button className="text-xs text-stamp-500 hover:underline">Usuń plik</button>
                </form>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Uploader caseId={c.id} kind="file" accept="application/pdf" multiple label="Dodaj pliki PDF" hint="Zaznacz wszystkie pliki naraz. W nazwie: „Odpowiedzi”/„Rozwiązanie” → ukryte jako odpowiedzi, „Wskazówki” → schowane jako wskazówki." />
          </div>
        </section>

        {/* WERSJA ONLINE */}
        <section className="card p-5">
          <h2 className="font-serif text-lg font-semibold">Wersja online</h2>
          <p className="mt-1 text-xs text-muted">Te same akta do czytania w przeglądarce — strony są tworzone z plików PDF powyżej. Rozwiązanie jest zapieczętowane do kliknięcia.</p>
          {manifest ? (
            <div className="mt-3 rounded-md border border-ink-700 p-3 text-xs text-paper-200">
              <p>
                {manifest.documents.length} dokumentów · {onlinePages} stron · wersja {online?.version as number}
              </p>
              <p className="mt-1">
                Status:{' '}
                {online?.is_published ? <strong className="text-emerald-400">opublikowana</strong> : <strong className="text-brass-300">szkic (widzi tylko admin)</strong>}
                {' · '}sprzedaż: {c.online_enabled ? <strong className="text-emerald-400">włączona</strong> : <strong className="text-muted">wyłączona</strong>}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/online/${c.slug}`} target="_blank" className="btn-secondary min-h-0 py-1.5 text-xs">
                  ▶ Podgląd
                </Link>
                <form action={setOnlinePublished}>
                  <input type="hidden" name="caseId" value={c.id} />
                  <input type="hidden" name="publish" value={online?.is_published ? 'false' : 'true'} />
                  <button className={`${online?.is_published ? 'btn-ghost' : 'btn-primary'} min-h-0 py-1.5 text-xs`}>
                    {online?.is_published ? 'Wycofaj publikację' : 'Opublikuj'}
                  </button>
                </form>
              </div>
              {online?.is_published && !c.online_enabled && (
                <p className="mt-2 text-brass-300">Aby sprzedawać — zaznacz „Sprzedawaj wersję online” w formularzu i zapisz.</p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-xs text-paper-200">Jeszcze nie wygenerowano.</p>
          )}
          <div className="mt-4">
            <OnlineGenerator caseId={c.id} hasExisting={Boolean(manifest)} />
          </div>
        </section>

        {/* NAGRANIA */}
        <section className="card p-5">
          <h2 className="font-serif text-lg font-semibold">Nagrania z przesłuchań (AI)</h2>
          <p className="mt-1 text-xs text-muted">Prywatne — odsłuch tylko dla kupujących (PDF i online). MP3/M4A/WAV/OGG lub MP4/WebM, do 50 MB.</p>
          <ul className="mt-4 space-y-3">
            {recordings.map((r) => (
              <li key={r.id} className="rounded-lg border border-ink-700 p-3">
                <form action={updateRecording} className="space-y-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="caseId" value={c.id} />
                  <input name="title" defaultValue={r.title} className="input py-1.5 text-xs" aria-label="Tytuł" />
                  <input name="person" defaultValue={r.person ?? ''} placeholder="Przesłuchiwany" className="input py-1.5 text-xs" />
                  <textarea name="description" defaultValue={r.description ?? ''} placeholder="Opis (opcjonalnie)" rows={2} className="input py-1.5 text-xs" />
                  <div className="flex items-center gap-2 text-xs">
                    <label className="flex items-center gap-1.5">
                      Kolejność
                      <input name="sort_order" type="number" defaultValue={r.sort_order} className="input w-16 py-1 text-xs" />
                    </label>
                    <span className="text-muted">
                      {formatDuration(r.duration_seconds)} {r.size_bytes ? `· ${formatBytes(r.size_bytes)}` : ''}
                    </span>
                  </div>
                  {r.mime_type.startsWith('video/') ? (
                    <video controls preload="none" src={`/api/nagranie/${r.id}`} className="w-full rounded" />
                  ) : (
                    <audio controls preload="none" src={`/api/nagranie/${r.id}`} className="w-full" />
                  )}
                  <button className="btn-secondary min-h-0 w-full py-1.5 text-xs">Zapisz</button>
                </form>
                <form action={deleteRecording} className="mt-2 text-right">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="caseId" value={c.id} />
                  <button className="text-xs text-stamp-500 hover:underline">Usuń nagranie</button>
                </form>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <RecordingUploader caseId={c.id} />
          </div>
        </section>

        {/* ZDJĘCIA / PRZYKŁADOWE STRONY */}
        <section className="card p-5">
          <h2 className="font-serif text-lg font-semibold">Zdjęcia i przykładowe strony</h2>
          <p className="mt-1 text-xs text-muted">Publiczne — widoczne na stronie produktu. Nie wrzucaj stron zdradzających rozwiązanie.</p>
          <ul className="mt-4 space-y-3">
            {((images ?? []) as CaseImage[]).map((img) => (
              <li key={img.id} className="rounded-lg border border-ink-700 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={publicStorageUrl('previews', img.path)!} alt="" className="max-h-40 w-full rounded object-contain" />
                <form action={updateImage} className="mt-2 flex gap-2">
                  <input type="hidden" name="id" value={img.id} />
                  <input type="hidden" name="caseId" value={c.id} />
                  <input name="caption" defaultValue={img.caption ?? ''} placeholder="Podpis" className="input flex-1 py-1.5 text-xs" />
                  <input name="sort_order" type="number" defaultValue={img.sort_order} className="input w-14 py-1.5 text-xs" aria-label="Kolejność" />
                  <button className="btn-secondary min-h-0 py-1.5 text-xs">OK</button>
                </form>
                <form action={deleteImage} className="mt-2 text-right">
                  <input type="hidden" name="id" value={img.id} />
                  <input type="hidden" name="caseId" value={c.id} />
                  <button className="text-xs text-stamp-500 hover:underline">Usuń</button>
                </form>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Uploader caseId={c.id} kind="preview" accept="image/jpeg,image/png,image/webp" multiple label="Dodaj zdjęcia" />
          </div>
        </section>

        <section className="card border-stamp-500/40 p-5">
          <h2 className="font-serif text-lg font-semibold text-stamp-500">Strefa niebezpieczna</h2>
          <p className="mt-1 text-xs text-muted">Usunięcie jest nieodwracalne. Sprawy już kupionej nie da się usunąć — możesz ją ukryć.</p>
          <form action={deleteCase} className="mt-3">
            <input type="hidden" name="id" value={c.id} />
            <button className="btn-danger w-full text-xs">Usuń sprawę na stałe</button>
          </form>
        </section>
      </aside>
    </div>
  );
}
