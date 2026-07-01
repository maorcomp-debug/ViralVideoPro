export type StoryPlatform = 'instagram' | 'facebook' | 'whatsapp';

export type StoryShareResult = 'opened' | 'cancelled' | 'unsupported';

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

function openAndroidStoryIntent(action: string, packageName: string): void {
  window.location.href =
    `intent:#Intent;action=${action};type=image/*;package=${packageName};end`;
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

/** Share story image to a specific platform (image only — no link). */
export async function openStoryPlatformShare(
  platform: StoryPlatform,
  imageBlob: Blob
): Promise<StoryShareResult> {
  const file = new File([imageBlob], 'viraly-story.png', { type: 'image/png' });
  const cfg = STORY_INTENTS[platform];

  if (navigator.share && (navigator.canShare?.({ files: [file] }) ?? true)) {
    try {
      await navigator.share({ files: [file] });
      return 'opened';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled';
    }
  }

  if (isAndroid()) {
    triggerImageDownload(imageBlob);
    setTimeout(() => {
      openAndroidStoryIntent(cfg.android, cfg.package);
    }, 400);
    return 'opened';
  }

  if (isIOS()) {
    await copyImageToClipboard(imageBlob);
    window.location.href = cfg.ios;
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
