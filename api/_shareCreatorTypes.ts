/** Internal creator-type keys — stored in DB, never localized labels. */
export const CREATOR_TYPE_KEYS = [
  'content_creator',
  'actor',
  'singer',
  'podcaster',
  'influencer',
  'comedian',
  'video_creator',
] as const;

export type CreatorTypeKey = (typeof CREATOR_TYPE_KEYS)[number];

export const CREATOR_TYPE_LABELS: Record<'he' | 'en', Record<CreatorTypeKey, string>> = {
  he: {
    content_creator: 'יוצר תוכן',
    actor: 'שחקן',
    singer: 'זמר',
    podcaster: 'פודקאסט',
    influencer: 'משפיען',
    comedian: 'סטנדאפיסט',
    video_creator: 'יוצר וידאו',
  },
  en: {
    content_creator: 'Content Creator',
    actor: 'Actor',
    singer: 'Singer',
    podcaster: 'Podcaster',
    influencer: 'Influencer',
    comedian: 'Comedian',
    video_creator: 'Video Creator',
  },
};

/** Legacy rows may still store Hebrew labels from before key-based storage. */
const LEGACY_LABEL_TO_KEY: Record<string, CreatorTypeKey> = {
  'יוצר תוכן': 'content_creator',
  שחקן: 'actor',
  זמר: 'singer',
  פודקאסט: 'podcaster',
  משפיען: 'influencer',
  סטנדאפיסט: 'comedian',
  'יוצר וידאו': 'video_creator',
};

export function isCreatorTypeKey(value: string): value is CreatorTypeKey {
  return (CREATOR_TYPE_KEYS as readonly string[]).includes(value);
}

export function normalizeCreatorTypeKey(raw: string | null | undefined): CreatorTypeKey | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (isCreatorTypeKey(trimmed)) return trimmed;
  return LEGACY_LABEL_TO_KEY[trimmed] ?? null;
}

export function resolveCreatorTypeLabel(
  raw: string | null | undefined,
  lang: string
): string | null {
  if (!raw?.trim()) return null;
  const key = normalizeCreatorTypeKey(raw);
  const locale: 'he' | 'en' = lang === 'en' ? 'en' : 'he';
  if (key) return CREATOR_TYPE_LABELS[locale][key];
  return raw.trim();
}

export function sharePublicLocale(lang: string | null | undefined): 'he' | 'en' {
  return lang === 'en' ? 'en' : 'he';
}

/** Server-rendered share page / OG card copy (no React i18n). */
export const SHARE_PUBLIC_COPY = {
  he: {
    viralScoreLabel: 'פוטנציאל ויראלי',
    cta: 'נתח את הסרטון שלך',
    unavailable: 'תוצאת השיתוף אינה זמינה עוד.',
    backHome: 'חזרה ל-VIRALY',
    titleSuffix: (score: number) => `${score}% פוטנציאל ויראלי | VIRALY`,
    ogLocale: 'he_IL',
    dir: 'rtl' as const,
  },
  en: {
    viralScoreLabel: 'Your AI Creator Score',
    cta: 'Analyze Your Video',
    unavailable: 'This share is no longer available.',
    backHome: 'Back to VIRALY',
    titleSuffix: (score: number) => `${score}% AI Creator Score | VIRALY`,
    ogLocale: 'en_US',
    dir: 'ltr' as const,
  },
};
