import { isDesktopBrowser } from './shareDevice';

export type SocialSharePlatform =
  | 'whatsapp'
  | 'telegram'
  | 'facebook'
  | 'threads'
  | 'instagram';

export type FeedShareResult = 'opened' | 'desktop_guide' | 'unsupported';

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

/** @deprecated Use openStoryPlatformShare from storySharePlatforms */
export async function openStoryCapableShare(opts: {
  shareUrl: string;
  message: string;
  title: string;
  imageBlob: Blob | null;
}): Promise<StoryShareResult> {
  if (!opts.imageBlob) return 'unsupported';
  const file = new File([opts.imageBlob], 'viraly-share.png', { type: 'image/png' });
  if (navigator.share && (navigator.canShare?.({ files: [file] }) ?? true)) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled';
    }
  }
  return 'unsupported';
}

/** Quick share — link + text only (no story image). */
export async function openQuickShare(opts: {
  shareUrl: string;
  message: string;
  title: string;
}): Promise<'shared' | 'cancelled' | 'unsupported'> {
  const text = `${opts.message}\n${opts.shareUrl}`;
  if (!supportsNativeShare()) return 'unsupported';
  try {
    await navigator.share({
      title: opts.title,
      text,
      url: opts.shareUrl,
    });
    return 'shared';
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return 'cancelled';
    return 'unsupported';
  }
}

export function buildSocialShareUrl(
  platform: SocialSharePlatform,
  shareUrl: string,
  message: string,
  desktop = false
): string | null {
  const url = encodeURIComponent(shareUrl);
  const text = encodeURIComponent(message);
  const combined = encodeURIComponent(`${message}\n${shareUrl}`);

  switch (platform) {
    case 'whatsapp':
      return desktop
        ? `https://web.whatsapp.com/send?text=${combined}`
        : `https://wa.me/?text=${combined}`;
    case 'telegram':
      return `https://t.me/share/url?url=${url}&text=${text}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
    case 'threads':
      return `https://www.threads.net/intent/post?text=${combined}`;
    case 'instagram':
      return null;
    default:
      return null;
  }
}

async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function tryOpenNewTab(url: string): boolean {
  const tab = window.open(url, '_blank', 'noopener,noreferrer');
  return tab !== null;
}

async function openInstagramFeedShare(shareUrl: string, message: string): Promise<FeedShareResult> {
  const text = `${message}\n${shareUrl}`;
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (!isAndroid && !isIOS) {
    await copyShareText(text);
    tryOpenNewTab('https://www.instagram.com/');
    return 'desktop_guide';
  }

  if (isAndroid) {
    const intent =
      `intent://share#Intent;action=android.intent.action.SEND;type=text/plain;` +
      `S.android.intent.extra.TEXT=${encodeURIComponent(text)};` +
      `package=com.instagram.android;end`;
    window.location.href = intent;
    return 'opened';
  }

  if (isIOS) {
    window.location.href = `instagram://sharesheet?text=${encodeURIComponent(text)}`;
    setTimeout(() => {
      tryOpenNewTab('https://www.instagram.com/');
    }, 900);
    return 'opened';
  }

  return 'unsupported';
}

/** Feed / post share — opens platform with link (not story). */
export async function openFeedShare(
  platform: SocialSharePlatform,
  shareUrl: string,
  message: string
): Promise<FeedShareResult> {
  const desktop = isDesktopBrowser();

  if (platform === 'instagram') {
    return openInstagramFeedShare(shareUrl, message);
  }

  const href = buildSocialShareUrl(platform, shareUrl, message, desktop);
  if (!href) return 'unsupported';

  if (!tryOpenNewTab(href)) {
    return 'desktop_guide';
  }
  return desktop ? 'desktop_guide' : 'opened';
}
