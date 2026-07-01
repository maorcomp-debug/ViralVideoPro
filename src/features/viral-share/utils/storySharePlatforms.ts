import { normalizeStoryBlob } from './captureStoryImage';
import { openInNewTab } from './openExternalTab';
import { isMobileDevice } from './shareDevice';

export type StoryPlatform = 'instagram' | 'facebook' | 'whatsapp';

export type StoryShareResult = 'opened' | 'cancelled' | 'unsupported' | 'desktop_guide';

const DEFAULT_LINK = 'https://viraly.co.il';

/** Desktop story upload is manual — open the platform home, not feed/story sharer URLs. */
const DESKTOP_STORY_WEB: Record<StoryPlatform, string> = {
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

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function triggerImageDownload(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'viraly-story.png';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
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

function openDesktopStoryShare(
  platform: StoryPlatform,
  normalized: Blob,
  url: string
): StoryShareResult {
  // Open platform tab synchronously (user gesture) so Viraly stays open.
  openInNewTab(DESKTOP_STORY_WEB[platform]);
  triggerImageDownload(normalized);
  void copyText(url);
  return 'desktop_guide';
}

/** Share story image to a specific platform with optional link sticker URL. */
export async function openStoryPlatformShare(
  platform: StoryPlatform,
  imageBlob: Blob,
  linkUrl: string = DEFAULT_LINK
): Promise<StoryShareResult> {
  const normalized = await normalizeStoryBlob(imageBlob);
  const file = new File([normalized], 'viraly-story.png', { type: 'image/png' });
  const cfg = STORY_INTENTS[platform];
  const url = linkUrl || DEFAULT_LINK;

  if (!isMobileDevice()) {
    return Promise.resolve(openDesktopStoryShare(platform, normalized, url));
  }

  if (navigator.share && (navigator.canShare?.({ files: [file] }) ?? true)) {
    try {
      const payload: ShareData = { files: [file] };
      if (platform === 'instagram' || platform === 'facebook') {
        payload.url = url;
      }
      if (navigator.canShare?.(payload) ?? true) {
        await navigator.share(payload);
        return 'opened';
      }
      await navigator.share({ files: [file] });
      return 'opened';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled';
    }
  }

  if (isAndroid()) {
    triggerImageDownload(normalized);
    setTimeout(() => {
      openAndroidStoryIntent(cfg.android, cfg.package, url);
    }, 500);
    return 'opened';
  }

  if (isIOS()) {
    await copyImageToClipboard(normalized);
    window.location.href = `${cfg.ios}?url=${encodeURIComponent(url)}`;
    return 'opened';
  }

  return 'unsupported';
}

export function canShareStoryImage(imageBlob: Blob | null): boolean {
  if (!imageBlob) return false;
  return true;
}

export function resolveStoryLinkUrl(sharePageUrl?: string | null): string {
  return sharePageUrl?.trim() || DEFAULT_LINK;
}
