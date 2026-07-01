export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeNameCandidate(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || looksLikeEmail(trimmed)) return undefined;
  return trimmed;
}

/** Prefer real full name (first + last); never use email as display name. */
export function resolveCreatorDisplayName(sources: {
  fullName?: string | null;
  metadataFullName?: string | null;
}): string | undefined {
  const candidates = [sources.fullName, sources.metadataFullName];

  for (const candidate of candidates) {
    const name = normalizeNameCandidate(candidate);
    if (!name) continue;
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length >= 2) return name;
  }

  for (const candidate of candidates) {
    const name = normalizeNameCandidate(candidate);
    if (name && name.length >= 2) return name;
  }

  return undefined;
}
