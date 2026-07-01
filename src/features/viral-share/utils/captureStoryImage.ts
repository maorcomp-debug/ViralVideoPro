import { toBlob } from 'html-to-image';

export const STORY_W = 1080;
export const STORY_H = 1920;

/** Modal body content width — matches ShareModalPanel (440) minus padding (20×2). */
export const MODAL_PREVIEW_CARD_WIDTH = 400;

const STORY_MARGIN_X = 36;
const STORY_MARGIN_TOP = 48;
const STORY_MARGIN_BOTTOM = 56;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load logo'));
    img.src = src;
  });
}

function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    )
  ).then(() => undefined);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode PNG'))), 'image/png', 0.92);
  });
}

/** Capture the visible preview card exactly as rendered in the modal. */
export async function capturePreviewCardElement(cardEl: HTMLElement): Promise<Blob> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForImages(cardEl);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const blob = await toBlob(cardEl, {
    cacheBust: true,
    pixelRatio: 2,
    skipFonts: false,
  });

  if (!blob) throw new Error('Failed to capture preview card');
  return blob;
}

/** Scale the modal preview card to fill a 9:16 story frame (same layout, larger). */
export async function compositeCardOntoStory(cardBlob: Blob): Promise<Blob> {
  const cardBitmap = await createImageBitmap(cardBlob);
  const canvas = document.createElement('canvas');
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    cardBitmap.close();
    return cardBlob;
  }

  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  const maxW = STORY_W - STORY_MARGIN_X * 2;
  const maxH = STORY_H - STORY_MARGIN_TOP - STORY_MARGIN_BOTTOM;
  const scale = Math.min(maxW / cardBitmap.width, maxH / cardBitmap.height);
  const dw = cardBitmap.width * scale;
  const dh = cardBitmap.height * scale;
  const dx = (STORY_W - dw) / 2;
  const dy = STORY_MARGIN_TOP + (maxH - dh) / 2;

  ctx.drawImage(cardBitmap, dx, dy, dw, dh);
  cardBitmap.close();

  return canvasToBlob(canvas);
}

/** Sample top-center band — true when gold logo pixels are absent. */
export async function isStoryLogoMissing(blob: Blob): Promise<boolean> {
  try {
    const bitmap = await createImageBitmap(blob);
    const w = bitmap.width;
    const h = bitmap.height;
    const sx = Math.floor(w * 0.28);
    const sy = Math.floor(h * 0.04);
    const sw = Math.max(1, Math.floor(w * 0.44));
    const sh = Math.max(1, Math.floor(h * 0.1));
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return true;
    }
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    bitmap.close();
    const { data } = ctx.getImageData(0, 0, sw, sh);
    let gold = 0;
    const total = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 170 && g > 110 && b < 120) gold++;
    }
    return gold / total < 0.008;
  } catch {
    return true;
  }
}

/** Draw logo onto story when the card capture skipped it. */
export async function compositeStoryLogo(blob: Blob, logoDataUrl: string): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return blob;
  }

  ctx.drawImage(bitmap, 0, 0, STORY_W, STORY_H);
  bitmap.close();

  const logo = await loadImageElement(logoDataUrl);
  const logoH = Math.round(STORY_H * 0.045);
  const logoW = (logo.width / logo.height) * logoH;
  const logoY = STORY_MARGIN_TOP + Math.round(STORY_H * 0.02);
  const logoX = STORY_W / 2 - logoW / 2;
  ctx.drawImage(logo, logoX, logoY, logoW, logoH);

  return canvasToBlob(canvas);
}

export async function isStoryImageBlank(blob: Blob): Promise<boolean> {
  if (blob.size < 8000) return true;
  try {
    const bitmap = await createImageBitmap(blob);
    const w = bitmap.width;
    const h = bitmap.height;
    const sx = Math.floor(w * 0.15);
    const sy = Math.floor(h * 0.12);
    const sw = Math.max(1, Math.floor(w * 0.7));
    const sh = Math.max(1, Math.floor(h * 0.6));
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return true;
    }
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    bitmap.close();
    const { data } = ctx.getImageData(0, 0, sw, sh);
    let bright = 0;
    const total = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] + data[i + 1] + data[i + 2] > 90) bright++;
    }
    return bright / total < 0.015;
  } catch {
    return true;
  }
}

export async function normalizeStoryBlob(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  if (bitmap.width === STORY_W && bitmap.height === STORY_H) {
    bitmap.close();
    return blob;
  }
  bitmap.close();
  return compositeCardOntoStory(blob);
}
