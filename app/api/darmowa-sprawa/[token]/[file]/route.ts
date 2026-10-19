import { NextResponse } from 'next/server';
import { isServiceRoleConfigured, siteConfig } from '@/lib/config';
import { FREE_CASE, FREE_CASE_FOLDER, getSubscriberByToken, listFreeFiles } from '@/lib/newsletter';
import { createAdminClient } from '@/lib/supabase/admin';
import { watermarkPdf } from '@/lib/watermark';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string; file: string }> }) {
  const { token, file } = await params;
  if (!isServiceRoleConfigured()) return new NextResponse('Nie znaleziono pliku', { status: 404 });
  const name = decodeURIComponent(file);
  const entry = (await listFreeFiles()).find((f) => f.name === name);
  if (!entry) return new NextResponse('Nie znaleziono pliku', { status: 404 });

  const sub = await getSubscriberByToken(token);
  if (!sub || sub.status === 'pending') return new NextResponse('Najpierw potwierdź zapis linkiem z e-maila.', { status: 403 });

  const { data: blob, error } = await createAdminClient().storage.from('case-files').download(`${FREE_CASE_FOLDER}/${entry.name}`);
  if (error || !blob) {
    console.error('[darmowa-sprawa]', error?.message);
    return new NextResponse(`Plik jest chwilowo niedostępny. Napisz do nas: ${siteConfig.contactEmail}`, { status: 500 });
  }
  // Licznik pobrań (Admin → Darmowa sprawa). Brak kolumn w bazie = po prostu nie liczy.
  try {
    const db = createAdminClient();
    const { data: cur, error: e1 } = await db.from('newsletter_subscribers').select('free_downloads, free_downloaded_at').eq('id', sub.id).maybeSingle();
    if (!e1 && cur)
      await db
        .from('newsletter_subscribers')
        .update({ free_downloads: ((cur.free_downloads as number) ?? 0) + 1, free_downloaded_at: cur.free_downloaded_at ?? new Date().toISOString() })
        .eq('id', sub.id);
  } catch {
    /* licznik nie może blokować pobrania */
  }
  let body: Uint8Array = new Uint8Array(await blob.arrayBuffer());
  try {
    body = await watermarkPdf(body, { email: sub.email, siteName: siteConfig.name });
  } catch (e) {
    console.error('[darmowa-sprawa] znak wodny', e);
  }
  return new NextResponse(Buffer.from(body), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="AKTA-${FREE_CASE.number}-${entry.name.replace(/[^\w.-]/g, '_')}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
