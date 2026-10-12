import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getUser } from '@/lib/auth';
import { siteConfig } from '@/lib/config';
import { isAdminUser } from '@/lib/online';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Obrazek kodu QR do wklejenia w Canvę: ?format=png (domyślnie) albo svg. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getUser();
  if (!user || !(await isAdminUser(user.id))) return new NextResponse('Brak dostępu', { status: 403 });
  const code = (await params).code.toLowerCase();
  if (!/^[a-z0-9-]{2,40}$/.test(code)) return new NextResponse('Zły kod', { status: 400 });
  const url = `${siteConfig.url}/qr/${code}`;
  const svg = new URL(req.url).searchParams.get('format') === 'svg';
  const opts = { errorCorrectionLevel: 'M' as const, margin: 2, color: { dark: '#1c1a17', light: '#ffffff' } };
  const name = `qr-${code}.${svg ? 'svg' : 'png'}`;
  const headers = { 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' };
  if (svg) return new NextResponse(await QRCode.toString(url, { ...opts, type: 'svg' }), { headers: { ...headers, 'Content-Type': 'image/svg+xml' } });
  const png = await QRCode.toBuffer(url, { ...opts, width: 1200 });
  return new NextResponse(new Uint8Array(png), { headers: { ...headers, 'Content-Type': 'image/png' } });
}
