'use client';

/**
 * Renderowanie stron PDF do obrazów w przeglądarce (pdf.js) — używane w panelu admina
 * do wygenerowania wersji online. Serwer nie musi mieć żadnych narzędzi graficznych.
 */
export interface RenderedPage {
  blob: Blob;
  ext: 'webp' | 'jpg';
  w: number;
  h: number;
}

let workerReady = false;

async function pdfjs() {
  const lib = await import('pdfjs-dist');
  if (!workerReady) {
    lib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    workerReady = true;
  }
  return lib;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Wywołuje onPage dla każdej strony po kolei (żeby nie trzymać wszystkich obrazów w pamięci). */
export async function renderPdf(
  url: string,
  onPage: (page: RenderedPage, index: number, total: number) => Promise<void>,
  targetWidth = 1240,
): Promise<number> {
  const lib = await pdfjs();
  const doc = await lib.getDocument({ url }).promise;
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: targetWidth / base.width });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Przeglądarka nie obsługuje rysowania (canvas).');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      let blob = await canvasToBlob(canvas, 'image/webp', 0.82);
      let ext: RenderedPage['ext'] = 'webp';
      if (!blob || blob.type !== 'image/webp') {
        blob = await canvasToBlob(canvas, 'image/jpeg', 0.85); // np. Safari bez WebP w canvas
        ext = 'jpg';
      }
      if (!blob) throw new Error(`Nie udało się zapisać strony ${i}.`);
      await onPage({ blob, ext, w: canvas.width, h: canvas.height }, i - 1, doc.numPages);
      page.cleanup();
      canvas.width = canvas.height = 0;
    }
    return doc.numPages;
  } finally {
    await doc.destroy();
  }
}
