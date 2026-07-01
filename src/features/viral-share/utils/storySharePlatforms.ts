export type StoryPlatform = 'instagram' | 'facebook' | 'whatsapp';

export type StoryShareResult = 'opened' | 'cancelled' | 'unsupported';

const DEFAULT_LINK = 'https://viraly.co.il';

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

/** Share story image to a specific platform with optional link sticker URL. */
export async function openStoryPlatformShare(
  platform: StoryPlatform,
  imageBlob: Blob,
  linkUrl: string = DEFAULT_LINK
): Promise<StoryShareResult> {
  const file = new File([imageBlob], 'viraly-story.png', { type: 'image/png' });
  const cfg = STORY_INTENTS[platform];
  const url = linkUrl || DEFAULT_LINK;

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
    triggerImageDownload(imageBlob);
    setTimeout(() => {
      openAndroidStoryIntent(cfg.android, cfg.package, url);
    }, 400);
    return 'opened';
  }

  if (isIOS()) {
    await copyImageToClipboard(imageBlob);
    window.location.href = `${cfg.ios}?url=${encodeURIComponent(url)}`;
    return 'opened';
  }

  return 'unsupported';
}

export function canShareStoryImage(imageBlob: Blob | null): boolean {
  if (!imageBlob) return false;
  if (isAndroid() || isIOS()) return true;
  if (!navigator.share) return false;
  const file = new File([imageBlob], 'viraly-story.png', { type: 'image/png' });
  return navigator.canShare?.({ files: [file] }) ?? false;
}

export function resolveStoryLinkUrl(sharePageUrl?: string | null): string {
  return sharePageUrl?.trim() || DEFAULT_LINK;
}
