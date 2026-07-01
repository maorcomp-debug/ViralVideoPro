import {
  captureStoryImageFromElement,
  isStoryImageBlank,
  normalizeStoryBlob,
} from './captureStoryImage';
import { renderShareCardImage } from './renderShareCardImage';
import type { ShareStrings } from '../i18n';

export interface BuildStoryImageInput {
  captureNode: HTMLElement | null;
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

/** DOM capture first (preview-quality), canvas fallback if blank. */
export async function buildStoryCardImage(input: BuildStoryImageInput): Promise<Blob> {
  if (input.captureNode) {
    try {
      const captured = await captureStoryImageFromElement(input.captureNode);
      if (!(await isStoryImageBlank(captured))) {
        return normalizeStoryBlob(captured);
      }
    } catch {
      /* fall through */
    }
  }

  const canvasBlob = await renderShareCardImage({
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
  });
  return normalizeStoryBlob(canvasBlob);
}
