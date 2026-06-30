import i18n from '../../../i18n';
import { shareEn, type ShareStrings } from './en';
import { shareHe } from './he';
import {
  resolveCreatorTypeLabel,
  type CreatorTypeKey,
} from './creatorTypeLabels';

export type ShareLocale = 'he' | 'en';
export type { ShareStrings };

export function getShareLocale(): ShareLocale {
  const lang = (i18n.language || i18n.resolvedLanguage || 'he').split('-')[0];
  return lang === 'en' ? 'en' : 'he';
}

export function isShareRtl(locale: ShareLocale = getShareLocale()): boolean {
  return locale !== 'en';
}

export function getShareStrings(locale?: ShareLocale): ShareStrings {
  const resolved = locale ?? getShareLocale();
  return resolved === 'en' ? shareEn : shareHe;
}

export function getCreatorTypeLabel(
  key: CreatorTypeKey,
  locale?: ShareLocale
): string {
  const s = getShareStrings(locale);
  return s.creatorTypes[key];
}

export { resolveCreatorTypeLabel, type CreatorTypeKey };
