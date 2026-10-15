import { NextResponse } from 'next/server';
import { isServiceRoleConfigured, siteConfig } from '@/lib/config';
import { getOrderByToken, orderIncludesCase } from '@/lib/guest';
import { isUuid } from '@/lib/orders';
import { allow } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { watermarkPdf } from '@/lib/watermark';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_WATERMARK_BYTES = 60 * 1024 * 1024;

/** Pobieranie pliku z zakupu bez konta: link dostępu + opłacone zamówienie zawierające sprawę (PDF). */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; fileId: string }> }) {
  const { token, fileId } = await params;
  if (!isServiceRoleConfigured() || !isUuid(fileId)) return new NextResponse('Nie znaleziono pliku', { status: 404 });
  if (!allow(`dostep:${token}`, 40, 10 * 60 * 1000)) {
    return new NextResponse('Zbyt wiele pobrań w krótkim czasie. Spróbuj ponownie za kilka minut.', { status: 429, headers: { 'Retry-After': '600' } });
  }

  const order = await getOrderByToken(token);
  if (!order) return new NextResponse('Nieprawidłowy link dostępu.', { status: 404 });
  if (order.status !== 'paid') return new NextResponse('To zamówienie nie jest opłacone albo zostało zwrócone.', { status: 403 });

  const db = createAdminClient();
  const { data: file } = await db.from('case_files').select('id, case_id, file_name, storage_path').eq('id', fileId).maybeSingle();
  if (!file || !orderIncludesCase(order, file.case_id as string, 'pdf')) return new NextResponse('Nie znaleziono pliku', { status: 404 });

  const { data: blob, error: dlError } = await db.storage.from('case-files').download(file.storage_path as string);
  if (!dlError && blob && blob.size <= MAX_WATERMARK_BYTES) {
    try {
      const out = await watermarkPdf(await blob.arrayBuffer(), { email: order.email, orderNumber: order.order_number, siteName: siteConfig.name });
      return new NextResponse(Buffer.from(out), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${String(file.file_name).replace(/[^\w.-]/g, '_')}"`,
          'Cache-Control': 'private, no-store',
          'X-Robots-Tag': 'noindex',
        },
      });
    } catch (e) {
      console.error('[dostep] znak wodny', e);
    }
  }

  const { data: signed, error } = await db.storage.from('case-files').createSignedUrl(file.storage_path as string, 60, { download: file.file_name as string });
  if (error || !signed?.signedUrl) {
    console.error('[dostep]', error?.message);
    return new NextResponse(`Nie udało się przygotować pliku. Napisz do nas: ${siteConfig.contactEmail}`, { status: 500 });
  }
  const res = NextResponse.redirect(signed.signedUrl);
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}
