import { toBlob } from 'html-to-image';

const STORY_W = 1080;
const STORY_H = 1920;

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

/** Capture an off-screen DOM node as a story PNG (1080×1920). */
export async function captureStoryImageFromElement(node: HTMLElement): Promise<Blob> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForImages(node);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const blob = await toBlob(node, {
    cacheBust: true,
    pixelRatio: 2,
    width: STORY_W,
    height: STORY_H,
    skipFonts: false,
    style: {
      animation: 'none',
      transition: 'none',
    },
  });

  if (!blob) throw new Error('Failed to capture story image');
  return blob;
}
