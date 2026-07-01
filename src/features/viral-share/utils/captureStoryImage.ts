import { toBlob } from 'html-to-image';

export const STORY_W = 1080;
export const STORY_H = 1920;

const CARD_TOP = 88;
const FOOTER_RESERVE = 220;

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

function fitStoryCardStage(node: HTMLElement): void {
  const cardStage = node.querySelector('[data-story-card-stage]') as HTMLElement | null;
  if (!cardStage) return;

  const maxCardH = STORY_H - CARD_TOP - FOOTER_RESERVE;
  cardStage.style.top = `${CARD_TOP}px`;
  cardStage.style.left = '50%';
  cardStage.style.transformOrigin = 'top center';

  const naturalH = cardStage.scrollHeight;
  const scale = naturalH > maxCardH ? maxCardH / naturalH : 1;
  cardStage.style.transform = `translateX(-50%) scale(${scale})`;
}

/** Sample top-center band — true when gold logo pixels are absent. */
export async function isStoryLogoMissing(blob: Blob): Promise<boolean> {
  try {
    const bitmap = await createImageBitmap(blob);
    const w = bitmap.width;
    const h = bitmap.height;
    const sx = Math.floor(w * 0.28);
    const sy = Math.floor(h * 0.05);
    const sw = Math.max(1, Math.floor(w * 0.44));
    const sh = Math.max(1, Math.floor(h * 0.12));
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

/** Draw logo at the top of the story card if capture clipped or skipped it. */
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
  const logoH = 79;
  const logoW = (logo.width / logo.height) * logoH;
  const logoY = CARD_TOP + 52;
  const logoX = STORY_W / 2 - logoW / 2;
  ctx.drawImage(logo, logoX, logoY, logoW, logoH);

  const composited = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png', 0.92);
  });
  return composited ?? blob;
}

/** True when the capture is effectively blank (DOM capture failed silently). */
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

/** Normalize to 1080×1920 PNG for reliable mobile story sharing. */
export async function normalizeStoryBlob(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  if (
    bitmap.width === STORY_W &&
    bitmap.height === STORY_H &&
    blob.size < 3_500_000
  ) {
    bitmap.close();
    return blob;
  }

  const canvas = document.createElement('canvas');
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return blob;
  }

  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, STORY_W, STORY_H);
  const scale = Math.min(STORY_W / bitmap.width, STORY_H / bitmap.height);
  const dw = bitmap.width * scale;
  const dh = bitmap.height * scale;
  const dx = (STORY_W - dw) / 2;
  const dy = (STORY_H - dh) / 2;
  ctx.drawImage(bitmap, dx, dy, dw, dh);
  bitmap.close();

  const normalized = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png', 0.92);
  });
  return normalized ?? blob;
}

/** Capture an off-screen DOM node as a story PNG (1080×1920). */
export async function captureStoryImageFromElement(node: HTMLElement): Promise<Blob> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  fitStoryCardStage(node);
  await waitForImages(node);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  fitStoryCardStage(node);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const blob = await toBlob(node, {
    cacheBust: true,
    pixelRatio: 1,
    width: STORY_W,
    height: STORY_H,
    skipFonts: false,
    style: {
      animation: 'none',
      transition: 'none',
      opacity: '1',
    },
  });

  if (!blob) throw new Error('Failed to capture story image');
  return blob;
}
