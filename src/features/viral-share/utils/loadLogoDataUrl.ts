let cachedLogoDataUrl: string | null = null;

/** Inline logo as data URL so html-to-image captures it reliably. */
export async function loadLogoDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;

  const url = `${window.location.origin}/Logo.png`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch logo');

  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read logo'));
    reader.readAsDataURL(blob);
  });

  cachedLogoDataUrl = dataUrl;
  return dataUrl;
}
