'use server';

import { getUser } from '@/lib/auth';
import { buildDocuments, checkOnlineAccess, loadOnline, readReading, writeReading, type ViewerDocument } from '@/lib/online';

async function access(slug: string) {
  const user = await getUser();
  if (!user) return null;
  const o = await loadOnline(slug);
  const a = await checkOnlineAccess(o, user.id);
  return a.ok && o?.manifest ? { user, o, manifest: o.manifest } : null;
}

export async function saveOnlineNotes(slug: string, notes: string): Promise<{ ok: boolean }> {
  const ctx = await access(slug);
  if (!ctx) return { ok: false };
  await writeReading(ctx.user.id, ctx.o.caseId, { notes: String(notes).slice(0, 20000) });
  return { ok: true };
}

/** Otwiera „kopertę” z rozwiązaniem — zapisuje moment otwarcia i zwraca strony. */
export async function openSolution(slug: string): Promise<{ documents?: ViewerDocument[]; error?: string }> {
  const ctx = await access(slug);
  if (!ctx) return { error: 'Brak dostępu.' };
  await writeReading(ctx.user.id, ctx.o.caseId, { solution_opened_at: new Date().toISOString() });
  return { documents: await buildDocuments(ctx.manifest, true) };
}

/** Odświeża linki do stron (ważne 2 h) — gdy czytelnik ma otwartą kartę dłużej. */
export async function refreshDocuments(slug: string): Promise<{ documents?: ViewerDocument[] }> {
  const ctx = await access(slug);
  if (!ctx) return {};
  const { solutionOpenedAt } = await readReading(ctx.user.id, ctx.o.caseId);
  return { documents: await buildDocuments(ctx.manifest, Boolean(solutionOpenedAt)) };
}
