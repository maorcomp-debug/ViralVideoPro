/** True for phones/tablets — not desktop browsers. */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

export function isDesktopBrowser(): boolean {
  return !isMobileDevice();
}
