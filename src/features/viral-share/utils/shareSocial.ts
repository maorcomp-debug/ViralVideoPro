export type SocialSharePlatform =
  | 'whatsapp'
  | 'telegram'
  | 'facebook'
  | 'threads'
  | 'instagram';

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

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

/** Opens Instagram share flow — app on mobile, web fallback on desktop. */
export async function openInstagramShare(shareUrl: string, message: string): Promise<void> {
  const text = `${message}\n${shareUrl}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: message,
        text: message,
        url: shareUrl,
      });
      return;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
    }
  }

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

  if (isMobileDevice()) {
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    return;
  }

  window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
}

export function openSocialShare(
  platform: SocialSharePlatform,
  shareUrl: string,
  message: string
): 'instagram' | 'opened' {
  if (platform === 'instagram') {
    return 'instagram';
  }
  const href = buildSocialShareUrl(platform, shareUrl, message);
  if (!href) return 'instagram';
  window.open(href, '_blank', 'noopener,noreferrer');
  return 'opened';
}
