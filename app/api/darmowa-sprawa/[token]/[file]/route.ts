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
