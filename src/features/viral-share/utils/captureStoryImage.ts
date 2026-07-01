import { toBlob } from 'html-to-image';

export const STORY_W = 1080;
export const STORY_H = 1920;

function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    )
  ).then(() => undefined);
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
  await waitForImages(node);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const blob = await toBlob(node, {
    cacheBust: true,
    pixelRatio: 1,
    width: STORY_W,
    height: STORY_H,
    skipFonts: false,
    includeQueryParams: true,
    style: {
      animation: 'none',
      transition: 'none',
      opacity: '1',
    },
  });

  if (!blob) throw new Error('Failed to capture story image');
  return blob;
}
