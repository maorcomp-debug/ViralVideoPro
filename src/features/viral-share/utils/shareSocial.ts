export type SocialSharePlatform =
  | 'whatsapp'
  | 'telegram'
  | 'facebook'
  | 'threads'
  | 'instagram';

const STORY_CAPABLE_PLATFORMS = new Set<SocialSharePlatform>([
  'instagram',
  'whatsapp',
  'facebook',
]);

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

export function supportsNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function supportsStoryShare(imageBlob: Blob | null): boolean {
  if (!supportsNativeShare() || !imageBlob) return false;
  const file = new File([imageBlob], 'viraly-share.png', { type: 'image/png' });
  const data: ShareData = { files: [file] };
  return navigator.canShare?.(data) ?? false;
}

export type StoryShareResult = 'shared' | 'cancelled' | 'unsupported';

export async function openStoryCapableShare(opts: {
  shareUrl: string;
  message: string;
  title: string;
  imageBlob: Blob | null;
}): Promise<StoryShareResult> {
  const text = `${opts.message}\n${opts.shareUrl}`;

  if (opts.imageBlob && supportsNativeShare()) {
    const file = new File([opts.imageBlob], 'viraly-share.png', { type: 'image/png' });
    const withImage: ShareData = {
      title: opts.title,
      text: opts.message,
      url: opts.shareUrl,
      files: [file],
    };
    if (navigator.canShare?.(withImage) ?? true) {
      try {
        await navigator.share(withImage);
        return 'shared';
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return 'cancelled';
      }
    }
  }

  if (supportsNativeShare()) {
    try {
      await navigator.share({
        title: opts.title,
        text,
        url: opts.shareUrl,
      });
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled';
    }
  }

  return 'unsupported';
}

export function buildSocialShareUrl(
  platform: SocialSharePlatform,
  shareUrl: string,
  message: string
): string | null {
  const url = encodeURIComponent(shareUrl);
  const text = encodeURIComponent(message);
  const combined = encodeURIComponent(`${message}\n${shareUrl}`);

  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${combined}`;
    case 'telegram':
      return `https://t.me/share/url?url=${url}&text=${text}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    case 'threads':
      return `https://www.threads.net/intent/post?text=${combined}`;
    case 'instagram':
      return null;
    default:
      return null;
  }
}

/** Opens Instagram — prefers native story-capable share with image on mobile. */
export async function openInstagramShare(
  shareUrl: string,
  message: string,
  imageBlob: Blob | null,
  title: string
): Promise<void> {
  const storyResult = await openStoryCapableShare({
    shareUrl,
    message,
    title,
    imageBlob,
  });
  if (storyResult !== 'unsupported') return;

  const text = `${message}\n${shareUrl}`;
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (isAndroid) {
    const intent =
      `intent://share#Intent;action=android.intent.action.SEND;type=text/plain;` +
      `S.android.intent.extra.TEXT=${encodeURIComponent(text)};` +
      `package=com.instagram.android;end`;
    window.location.href = intent;
    return;
  }

  if (isIOS) {
    window.location.href = `instagram://sharesheet?text=${encodeURIComponent(text)}`;
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    }, 900);
    return;
  }

  window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
}

export async function openSocialShare(
  platform: SocialSharePlatform,
  shareUrl: string,
  message: string,
  opts?: { imageBlob?: Blob | null; title?: string }
): Promise<void> {
  const imageBlob = opts?.imageBlob ?? null;
  const title = opts?.title ?? message;

  if (STORY_CAPABLE_PLATFORMS.has(platform) && isMobileDevice()) {
    const result = await openStoryCapableShare({
      shareUrl,
      message,
      title,
      imageBlob,
    });
    if (result !== 'unsupported') return;
  }

  if (platform === 'instagram') {
    await openInstagramShare(shareUrl, message, imageBlob, title);
    return;
  }

  const href = buildSocialShareUrl(platform, shareUrl, message);
  if (href) {
    window.open(href, '_blank', 'noopener,noreferrer');
  }
}
