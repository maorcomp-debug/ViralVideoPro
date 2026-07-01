import { normalizeStoryBlob } from './captureStoryImage';
import { openInNewTab } from './openExternalTab';
import { isMobileDevice } from './shareDevice';

export type StoryPlatform = 'instagram' | 'facebook' | 'whatsapp';

export type StoryShareResult = 'opened' | 'cancelled' | 'unsupported' | 'desktop_guide';

const DEFAULT_LINK = 'https://viraly.co.il';

const PLATFORM_WEB: Record<StoryPlatform, string> = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  whatsapp: 'https://web.whatsapp.com/',
};

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent || '');
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    return false;
  }
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

function openAndroidStoryIntent(
  action: string,
  packageName: string,
  linkUrl: string
): void {
  const encoded = encodeURIComponent(linkUrl);
  window.location.href =
    `intent:#Intent;action=${action};type=image/*;package=${packageName};` +
    `S.content_url=${encoded};S.link_url=${encoded};end`;
}

const STORY_INTENTS: Record<StoryPlatform, { android: string; package: string; ios: string }> = {
  instagram: {
    android: 'com.instagram.share.ADD_TO_STORY',
    package: 'com.instagram.android',
    ios: 'instagram-stories://share',
  },
  facebook: {
    android: 'com.facebook.stories.ADD_TO_STORY',
    package: 'com.facebook.katana',
    ios: 'fb-stories://share',
  },
  whatsapp: {
    android: 'android.intent.action.SEND',
    package: 'com.whatsapp',
    ios: 'whatsapp://app',
  },
};

async function tryNativeStoryShare(
  platform: StoryPlatform,
  file: File,
  url: string
): Promise<StoryShareResult | null> {
  if (!navigator.share) return null;

  const payloads: ShareData[] = [];
  if (platform === 'instagram' || platform === 'facebook') {
    payloads.push({ files: [file], url });
  }
  payloads.push({ files: [file] });

  for (const payload of payloads) {
    if (navigator.canShare && !navigator.canShare(payload)) continue;
    try {
      await navigator.share(payload);
      return 'opened';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled';
    }
  }

  return null;
}

/** Share story image to a specific platform with optional link sticker URL. */
export async function openStoryPlatformShare(
  platform: StoryPlatform,
  imageBlob: Blob,
  linkUrl: string = DEFAULT_LINK
): Promise<StoryShareResult> {
  const url = linkUrl || DEFAULT_LINK;
  const cfg = STORY_INTENTS[platform];

  // Try Web Share API first (mobile + desktop) — same flow, no auto-download.
  const file = new File([imageBlob], 'viraly-story.png', { type: 'image/png' });
  const nativeResult = await tryNativeStoryShare(platform, file, url);
  if (nativeResult) return nativeResult;

  const normalized = await normalizeStoryBlob(imageBlob);
  const normalizedFile = new File([normalized], 'viraly-story.png', { type: 'image/png' });
  const nativeRetry = await tryNativeStoryShare(platform, normalizedFile, url);
  if (nativeRetry) return nativeRetry;

  if (isMobileDevice()) {
    if (isAndroid()) {
      openAndroidStoryIntent(cfg.android, cfg.package, url);
      return 'opened';
    }

    if (isIOS()) {
      await copyImageToClipboard(normalized);
      window.location.href = `${cfg.ios}?url=${encodeURIComponent(url)}`;
      return 'opened';
    }
  }

  // Desktop fallback — open platform for login/share; user stays on Viraly.
  openInNewTab(PLATFORM_WEB[platform]);
  return 'desktop_guide';
}

export function canShareStoryImage(imageBlob: Blob | null): boolean {
  if (!imageBlob) return false;
  return true;
}

export function resolveStoryLinkUrl(sharePageUrl?: string | null): string {
  return sharePageUrl?.trim() || DEFAULT_LINK;
}
