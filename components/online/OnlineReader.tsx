'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { openSolution, refreshDocuments, saveOnlineNotes } from '@/app/online/[slug]/actions';
import { RecordingsList, type RecordingItem } from '@/components/case/RecordingsList';
import type { ViewerDocument } from '@/lib/online';

const REC_TAB = '__nagrania';

interface Props {
  slug: string;
  title: string;
  caseNumber: string;
  documents: ViewerDocument[];
  recordings: RecordingItem[];
  initialNotes: string;
  viewerLabel: string;
  preview: boolean;
}

function Watermark({ label, dense = false }: { label: string; dense?: boolean }) {
  if (!label) return null;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 flex select-none flex-wrap content-around justify-around overflow-hidden ${dense ? 'gap-24' : 'gap-10'} opacity-[0.09]`}
    >
      {Array.from({ length: dense ? 10 : 4 }).map((_, i) => (
        <span key={i} className="-rotate-[20deg] whitespace-nowrap text-sm font-bold text-ink-950 sm:text-base">
          {label}
        </span>
      ))}
    </div>
  );
}

function Lightbox({
  doc,
  index,
  label,
  onClose,
  onMove,
}: {
  doc: ViewerDocument;
  index: number;
  label: string;
  onClose: () => void;
  onMove: (i: number) => void;
}) {
  const [zoom, setZoom] = useState(false);
  const page = doc.pages[index];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < doc.pages.length - 1) onMove(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onMove(index - 1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [doc.pages.length, index, onClose, onMove]);
  if (!page) return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink-950" role="dialog" aria-modal aria-label={`${doc.title}, strona ${index + 1}`}>
      <div className="flex items-center gap-2 border-b border-ink-800 px-3 py-2 sm:px-4">
        <p className="min-w-0 flex-1 truncate text-sm text-paper-100">
          {doc.title} · <span className="font-mono text-brass-300">{index + 1}/{doc.pages.length}</span>
        </p>
        <button type="button" onClick={() => onMove(index - 1)} disabled={index === 0} className="btn-ghost px-2 py-1 text-sm" aria-label="Poprzednia strona">
          ←
        </button>
        <button type="button" onClick={() => onMove(index + 1)} disabled={index >= doc.pages.length - 1} className="btn-ghost px-2 py-1 text-sm" aria-label="Następna strona">
          →
        </button>
        <button type="button" onClick={() => setZoom((z) => !z)} className="btn-ghost hidden py-1 text-sm sm:inline-flex">
          {zoom ? 'Dopasuj' : 'Powiększ'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary py-1 text-sm" autoFocus>
          Zamknij
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2 sm:p-4">
        <div className={`relative mx-auto ${zoom ? 'w-[200%] max-w-none sm:w-[160%]' : 'w-full max-w-4xl'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.url}
            alt={`${doc.title} — strona ${index + 1}`}
            width={page.w}
            height={page.h}
            onClick={() => setZoom((z) => !z)}
            className={`h-auto w-full rounded bg-white ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          />
          <Watermark label={label} dense />
        </div>
      </div>
    </div>
  );
}

export function OnlineReader({ slug, title, caseNumber, documents: initialDocs, recordings, initialNotes, viewerLabel, preview }: Props) {
  const [documents, setDocuments] = useState(initialDocs);
  const regular = documents.filter((d) => !d.solution);
  const solutionDocs = documents.filter((d) => d.solution);
  const tabs = [
    ...regular.filter((d) => !d.hint).map((d) => ({ id: d.id, label: d.title, meta: `${d.pageCount} str.` })),
    ...regular.filter((d) => d.hint).map((d) => ({ id: d.id, label: `💡 ${d.title}`, meta: `${d.pageCount} str.` })),
    ...(recordings.length ? [{ id: REC_TAB, label: 'Nagrania z przesłuchań', meta: `${recordings.length}` }] : []),
    ...solutionDocs.map((d) => ({ id: d.id, label: d.title, meta: d.locked ? '🔐' : `${d.pageCount} str.` })),
  ];
  const storeKey = `akta-online-tab:${slug}`;
  const [active, setActive] = useState(tabs[0]?.id ?? '');
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [notesStatus, setNotesStatus] = useState<'saved' | 'dirty' | 'saving' | 'error'>('saved');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hintsShown, setHintsShown] = useState<Record<string, boolean>>({});
  // Wskazówki i odpowiedzi: po jednej stronie naraz (jak zasłanianie kartką w wersji papierowej)
  const [pageAt, setPageAt] = useState<Record<string, number>>({});
  const [pending, startTransition] = useTransition();
  const refreshed = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);

  // zapamiętana zakładka
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storeKey);
      if (saved && tabs.some((t) => t.id === saved)) setActive(saved);
    } catch {
      /* brak dostępu do pamięci przeglądarki */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (id: string) => {
    setActive(id);
    setConfirmOpen(false);
    try {
      window.localStorage.setItem(storeKey, id);
    } catch {
      /* ignoruj */
    }
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // autozapis notatek
  const firstNotes = useRef(true);
  useEffect(() => {
    if (firstNotes.current) {
      firstNotes.current = false;
      return;
    }
    setNotesStatus('dirty');
    const t = setTimeout(async () => {
      setNotesStatus('saving');
      const res = await saveOnlineNotes(slug, notes);
      setNotesStatus(res.ok ? 'saved' : 'error');
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  // wygasłe linki do stron → jednorazowe odświeżenie
  const onImgError = useCallback(() => {
    if (refreshed.current) return;
    refreshed.current = true;
    refreshDocuments(slug).then((r) => r.documents && setDocuments(r.documents));
  }, [slug]);

  const doc = documents.find((d) => d.id === active);
  const idx = tabs.findIndex((t) => t.id === active);
  const nextTab = tabs[idx + 1];

  const reveal = () =>
    startTransition(async () => {
      const res = await openSolution(slug);
      if (res.documents) {
        setDocuments(res.documents);
        setConfirmOpen(false);
      }
    });

  return (
    <div className="pb-24">
      {/* Pasek */}
      <div className="sticky top-16 z-30 border-b border-ink-800 bg-ink-950">
        <div className="container-page flex items-center gap-2 py-2 sm:gap-3 sm:py-3">
          <div className="min-w-0 flex-1">
            <p className="eyebrow flex items-center gap-2 whitespace-nowrap">
              Akta #{caseNumber}
              <span className="hidden sm:inline">· wersja online</span>
              {preview && <span className="rounded bg-stamp-500/20 px-1.5 py-0.5 text-stamp-500">podgląd admina</span>}
            </p>
            <p className="truncate font-serif text-lg text-paper-50">{title}</p>
          </div>
          {recordings.length > 0 && (
            <button type="button" onClick={() => go(REC_TAB)} className="btn-secondary shrink-0 px-3 py-2 text-sm" aria-pressed={active === REC_TAB}>
              🎧<span className="hidden sm:inline"> Nagrania</span>
            </button>
          )}
          <button type="button" onClick={() => setNotesOpen((o) => !o)} className="btn-secondary shrink-0 px-3 py-2 text-sm" aria-pressed={notesOpen}>
            ✎ Notatki
          </button>
        </div>
        <nav className="container-page flex gap-2 overflow-x-auto pb-3" aria-label="Dokumenty sprawy">
          {tabs.map((t) => {
            const isSolution = solutionDocs.some((d) => d.id === t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => go(t.id)}
                aria-current={active === t.id ? 'page' : undefined}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition ${
                  active === t.id
                    ? isSolution
                      ? 'border-stamp-500 bg-stamp-500 text-paper-50'
                      : 'border-brass-400 bg-brass-400 text-ink-950'
                    : isSolution
                      ? 'border-stamp-500/50 text-stamp-500 hover:border-stamp-500'
                      : 'border-ink-700 text-paper-200 hover:border-brass-500/60'
                }`}
              >
                {t.label} <span className="opacity-70">· {t.meta}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div ref={topRef} className="container-page scroll-mt-40 pt-6">
        {active === REC_TAB ? (
          <section className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold">Nagrania z przesłuchań</h1>
            <p className="mt-2 text-sm text-paper-200">Słuchaj uważnie — ton głosu, pauzy i przejęzyczenia to też dowody.</p>
            <div className="mt-6">
              <RecordingsList items={recordings} />
            </div>
          </section>
        ) : doc?.hint && !hintsShown[doc.id] ? (
          <section className="mx-auto max-w-xl py-10 text-center">
            <div className="card border-brass-500/50 p-8">
              <p className="text-5xl" aria-hidden>
                💡
              </p>
              <h1 className="mt-4 text-3xl font-bold">{doc.title}</h1>
              <p className="mt-3 text-paper-200">Wskazówki zdradzają część rozwiązania. Zaglądaj tylko do celu, na którym utknąłeś — i nie czytaj dalej.</p>
              <button type="button" onClick={() => setHintsShown((h) => ({ ...h, [doc.id]: true }))} className="btn-primary mt-6">
                Pokaż wskazówki
              </button>
            </div>
          </section>
        ) : doc?.locked ? (
          <section className="mx-auto max-w-xl py-10 text-center">
            <div className="card border-stamp-500/50 p-8">
              <p className="text-5xl" aria-hidden>
                ✉️
              </p>
              <h1 className="mt-4 text-3xl font-bold">{doc.title}</h1>
              <p className="mt-3 text-paper-200">
                Zapieczętowane ({doc.pageCount} str.). Odpowiedź do każdego celu sprawdzaj po jego rozwiązaniu — na 1. stronie jest spis, a „skocz do strony” zabierze cię od razu we właściwe miejsce. Nazwisko zabójcy jest na ostatnich stronach.
              </p>
              {!confirmOpen ? (
                <button type="button" onClick={() => setConfirmOpen(true)} className="btn-danger mt-6">
                  Otwórz odpowiedzi
                </button>
              ) : (
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-semibold text-stamp-500">Na pewno? Zobaczysz odpowiedzi — przewijaj ostrożnie, żeby nie przeczytać za dużo.</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button type="button" onClick={reveal} disabled={pending} className="btn-danger">
                      {pending ? 'Otwieram…' : 'Tak, otwórz'}
                    </button>
                    <button type="button" onClick={() => setConfirmOpen(false)} className="btn-ghost">
                      Jeszcze nie
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : doc ? (
          (() => {
          const paged = doc.solution || doc.hint;
          const cur = Math.min(pageAt[doc.id] ?? 0, Math.max(0, doc.pages.length - 1));
          const goPage = (i: number) => {
            setPageAt((m) => ({ ...m, [doc.id]: Math.max(0, Math.min(doc.pages.length - 1, i)) }));
            topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          };
          const shown = paged ? doc.pages.slice(cur, cur + 1).map((p) => ({ p, i: cur })) : doc.pages.map((p, i) => ({ p, i }));
          return (
          <section className="mx-auto max-w-4xl">
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="text-2xl font-bold sm:text-3xl">{doc.title}</h1>
              {doc.pageCount > 3 || paged ? (
                <label className="flex shrink-0 items-center gap-2 text-xs text-muted">
                  Strona
                  <select
                    className="input w-auto py-1 text-xs"
                    value={paged ? String(cur + 1) : ''}
                    onChange={(e) =>
                      paged
                        ? goPage(Number(e.target.value) - 1)
                        : document.getElementById(`strona-${e.target.value}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                    aria-label="Przejdź do strony"
                  >
                    <option value="" disabled>
                      skocz do…
                    </option>
                    {doc.pages.map((_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1} / {doc.pageCount}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span className="shrink-0 font-mono text-xs text-muted">{doc.pageCount} str.</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              {paged
                ? 'Pokazujemy jedną stronę naraz, żeby nie przeczytać za dużo. Numery stron znajdziesz w spisie na 1. stronie.'
                : 'Kliknij stronę, aby ją powiększyć. Czytaj po kolei — nie zaglądaj do przodu.'}
            </p>
            <ol className="mt-5 space-y-6">
              {shown.map(({ p, i }) => (
                <li key={p.url || i} id={`strona-${i + 1}`} className="scroll-mt-44">
                  <button type="button" onClick={() => setLightbox(i)} className="relative block w-full cursor-zoom-in overflow-hidden rounded-md bg-white shadow-lg shadow-black/40" aria-label={`Powiększ stronę ${i + 1}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={`${doc.title} — strona ${i + 1}`} width={p.w} height={p.h} loading={i < 2 ? 'eager' : 'lazy'} onError={onImgError} className="h-auto w-full" />
                    <Watermark label={viewerLabel} />
                  </button>
                  <p className="mt-2 text-center font-mono text-xs text-muted">
                    {i + 1} / {doc.pageCount}
                  </p>
                </li>
              ))}
            </ol>
            {paged && doc.pages.length > 1 && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <button type="button" onClick={() => goPage(cur - 1)} disabled={cur === 0} className="btn-secondary py-2 text-sm">
                  ← Poprzednia
                </button>
                <span className="font-mono text-xs text-muted">
                  {cur + 1} / {doc.pageCount}
                </span>
                <button type="button" onClick={() => goPage(cur + 1)} disabled={cur >= doc.pages.length - 1} className="btn-secondary py-2 text-sm">
                  Następna →
                </button>
              </div>
            )}
          </section>
          );
          })()
        ) : (
          <p className="py-20 text-center text-paper-200">Brak dokumentów.</p>
        )}

        {nextTab && (
          <div className="mx-auto mt-10 max-w-4xl text-right">
            <button type="button" onClick={() => go(nextTab.id)} className="btn-primary">
              Dalej: {nextTab.label} →
            </button>
          </div>
        )}
      </div>

      {/* Notatki */}
      {notesOpen && (
        <aside className="fixed inset-x-0 bottom-0 z-40 flex max-h-[70vh] flex-col border-t border-brass-500/40 bg-ink-900 shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[420px] sm:rounded-lg sm:border" aria-label="Notatki">
          <div className="flex items-center justify-between border-b border-ink-800 px-4 py-2">
            <p className="font-serif text-lg text-paper-50">Notatki śledczego</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted" aria-live="polite">
                {notesStatus === 'saving' ? 'Zapisuję…' : notesStatus === 'dirty' ? '…' : notesStatus === 'error' ? 'Błąd zapisu' : 'Zapisano ✓'}
              </span>
              <button type="button" onClick={() => setNotesOpen(false)} className="btn-ghost py-1 text-sm">
                Zamknij
              </button>
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 20000))}
            placeholder="Godziny, kłamstwa, podejrzenia… Notatki zapisują się automatycznie na twoim koncie."
            className="min-h-[40vh] flex-1 resize-none bg-transparent p-4 font-mono text-sm text-paper-100 outline-none placeholder:text-muted"
          />
        </aside>
      )}

      {lightbox !== null && doc && !doc.locked && (
        <Lightbox doc={doc} index={lightbox} label={viewerLabel} onClose={() => setLightbox(null)} onMove={(i) => setLightbox(Math.max(0, Math.min(doc.pages.length - 1, i)))} />
      )}
    </div>
  );
}
