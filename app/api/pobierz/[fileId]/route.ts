import { NextResponse } from 'next/server';
import { isSupabaseConfigured, siteConfig } from '@/lib/config';
import { isUuid } from '@/lib/orders';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { watermarkPdf } from '@/lib/watermark';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Vercel przyjmuje odpowiedź funkcji do ok. 4,5 MB — większe pliki idą bez znaku wodnego przez jednorazowy link. */
const MAX_WATERMARK_BYTES = 4 * 1024 * 1024;

/**
 * Bezpieczne pobieranie: sprawdzamy zalogowanie i prawo do sprawy,
 * dopisujemy znak wodny z e-mailem kupującego i numerem zamówienia, a potem wysyłamy plik.
 */
export async function GET(req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  if (!isSupabaseConfigured() || !isUuid(fileId)) return new NextResponse('Nie znaleziono pliku', { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL(`/logowanie?next=${encodeURIComponent('/konto/sprawy')}`, siteConfig.url));
  }

  const db = createAdminClient();
  const { data: file } = await db
    .from('case_files')
    .select('id, case_id, file_name, storage_path')
    .eq('id', fileId)
    .maybeSingle();
  if (!file) return new NextResponse('Nie znaleziono pliku', { status: 404 });

  const [{ data: entitlement }, { data: profile }] = await Promise.all([
    db.from('entitlements').select('case_id, orders(order_number)').eq('user_id', user.id).eq('case_id', file.case_id).eq('format', 'pdf').maybeSingle(),
    db.from('profiles').select('is_admin').eq('id', user.id).maybeSingle(),
  ]);
  if (!entitlement && !profile?.is_admin) {
    return new NextResponse('Brak dostępu do tego pliku. Kup sprawę, aby pobrać materiały.', { status: 403 });
  }

  const { data: blob, error: dlError } = await db.storage.from('case-files').download(file.storage_path);
  if (!dlError && blob && blob.size <= MAX_WATERMARK_BYTES) {
    try {
      const rel = (entitlement as { orders?: { order_number?: number } | { order_number?: number }[] | null } | null)?.orders;
      const orderNumber = Array.isArray(rel) ? rel[0]?.order_number : rel?.order_number;
      const out = await watermarkPdf(await blob.arrayBuffer(), {
        email: entitlement ? (user.email ?? user.id) : `ADMIN ${user.email ?? ''}`,
        orderNumber: orderNumber ?? null,
        siteName: siteConfig.name,
      });
      return new NextResponse(Buffer.from(out), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${file.file_name.replace(/[^\w.-]/g, '_')}"`,
          'Cache-Control': 'private, no-store',
          'X-Robots-Tag': 'noindex',
        },
      });
    } catch (e) {
      console.error('[pobierz] znak wodny', e);
    }
  }

  const { data: signed, error } = await db.storage
    .from('case-files')
    .createSignedUrl(file.storage_path, 60, { download: file.file_name });
  if (error || !signed?.signedUrl) {
    console.error('[pobierz]', error?.message);
    return new NextResponse(`Nie udało się przygotować pliku. Napisz do nas: ${siteConfig.contactEmail}`, { status: 500 });
  }

  const res = NextResponse.redirect(signed.signedUrl);
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}
