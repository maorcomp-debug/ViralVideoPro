/** Open a URL in a new tab without navigating the current Viraly page. */
export function openInNewTab(url: string): boolean {
  try {
    const tab = window.open('about:blank', '_blank', 'noopener,noreferrer');
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
      return true;
    }
  } catch {
    /* fall through to anchor */
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  return true;
}
