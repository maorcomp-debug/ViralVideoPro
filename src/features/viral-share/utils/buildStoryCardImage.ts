import {
  capturePreviewCardElement,
  compositeCardOntoStory,
  compositeStoryLogo,
  isStoryImageBlank,
  isStoryLogoMissing,
} from './captureStoryImage';
import { renderShareCardImage } from './renderShareCardImage';
import type { ShareStrings } from '../i18n';

export interface BuildStoryImageInput {
  previewCardElement: HTMLElement | null;
  fallbackCaptureRoot: HTMLElement | null;
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

async function buildFromCardBlob(cardBlob: Blob, logoDataUrl: string): Promise<Blob> {
  let storyBlob = await compositeCardOntoStory(cardBlob);
  if (await isStoryLogoMissing(storyBlob)) {
    storyBlob = await compositeStoryLogo(storyBlob, logoDataUrl);
  }
  return storyBlob;
}

/** Capture the modal preview card and upscale to story size (identical text layout). */
export async function buildStoryCardImage(input: BuildStoryImageInput): Promise<Blob> {
  const sources = [
    input.previewCardElement,
    input.fallbackCaptureRoot?.querySelector('[data-share-preview-card]') as HTMLElement | null,
  ].filter(Boolean) as HTMLElement[];

  for (const cardEl of sources) {
    try {
      const cardBlob = await capturePreviewCardElement(cardEl);
      const storyBlob = await buildFromCardBlob(cardBlob, input.logoDataUrl);
      if (!(await isStoryImageBlank(storyBlob))) {
        return storyBlob;
      }
    } catch {
      /* try next source */
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
    logoDataUrl: input.logoDataUrl,
  });
  return buildFromCardBlob(canvasBlob, input.logoDataUrl);
}
