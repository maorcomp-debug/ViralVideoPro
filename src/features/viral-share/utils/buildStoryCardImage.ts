import {
  captureStoryImageFromElement,
  compositeStoryLogo,
  isStoryImageBlank,
  isStoryLogoMissing,
  normalizeStoryBlob,
} from './captureStoryImage';
import { renderShareCardImage } from './renderShareCardImage';
import type { ShareStrings } from '../i18n';

export interface BuildStoryImageInput {
  captureNode: HTMLElement | null;
  logoDataUrl: string;
  viralScore: number;
  metrics: string[];
  insight: string;
  creatorName?: string;
  creatorTypeLabel: string;
  showCreatorName: boolean;
  showCreatorType: boolean;
  strings: ShareStrings;
  rtl: boolean;
  siteUrl: string;
}

async function ensureStoryLogo(blob: Blob, logoDataUrl: string): Promise<Blob> {
  if (await isStoryLogoMissing(blob)) {
    return compositeStoryLogo(blob, logoDataUrl);
  }
  return blob;
}

/** DOM capture first (preview-quality), canvas fallback if blank. */
export async function buildStoryCardImage(input: BuildStoryImageInput): Promise<Blob> {
  let blob: Blob | null = null;

  if (input.captureNode) {
    try {
      const captured = await captureStoryImageFromElement(input.captureNode);
      if (!(await isStoryImageBlank(captured))) {
        blob = captured;
      }
    } catch {
      /* fall through */
    }
  }

  if (!blob) {
    blob = await renderShareCardImage({
      viralScore: input.viralScore,
      metrics: input.metrics,
      insight: input.insight,
      creatorName: input.creatorName,
      creatorTypeLabel: input.creatorTypeLabel,
      showCreatorName: input.showCreatorName,
      showCreatorType: input.showCreatorType,
      strings: input.strings,
      rtl: input.rtl,
      siteUrl: input.siteUrl,
      logoDataUrl: input.logoDataUrl,
    });
  }

  const withLogo = await ensureStoryLogo(blob, input.logoDataUrl);
  return normalizeStoryBlob(withLogo);
}
