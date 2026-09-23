import 'server-only';
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/** Tylko znaki ASCII — czcionka standardowa PDF nie ma polskich liter. */
const ascii = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .replace(/[^\x20-\x7E]/g, '');

/**
 * Znak wodny licencji: dane kupującego na dole każdej strony i pionowo przy lewej krawędzi.
 * Nie przeszkadza w grze, ale utrudnia anonimowe udostępnianie plików.
 */
export async function watermarkPdf(bytes: ArrayBuffer | Uint8Array, opts: { email: string; orderNumber?: number | null; siteName: string }) {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const who = ascii(opts.email).slice(0, 80);
  const order = opts.orderNumber ? ` - zamowienie nr ${opts.orderNumber}` : '';
  const line = `Licencja osobista: ${who}${order} - ${ascii(opts.siteName)} - kopiowanie i udostepnianie zabronione`;
  const size = 6.5;
  const color = rgb(0.45, 0.43, 0.4);

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const w = font.widthOfTextAtSize(line, size);
    page.drawText(line, { x: Math.max(8, (width - w) / 2), y: 7, size, font, color, opacity: 0.85 });
    page.drawText(line, { x: 9, y: Math.max(8, (height - w) / 2), size, font, color, opacity: 0.55, rotate: degrees(90) });
  }

  pdf.setSubject(`Licencja osobista: ${who}${order}`);
  pdf.setKeywords([who, opts.orderNumber ? `zamowienie-${opts.orderNumber}` : 'bez-zamowienia']);
  pdf.setProducer(ascii(opts.siteName));
  return pdf.save();
}
