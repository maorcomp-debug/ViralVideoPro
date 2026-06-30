import i18n from './index';

const STORAGE_KEY = 'app_language';

const PRESERVED_LOCAL_STORAGE_KEYS = [STORAGE_KEY, 'just_logged_out'] as const;

/**
 * Central function for changing app language.
 * i18n's languageChanged listener handles: document.dir, document.lang, localStorage.
 * Use this everywhere - Landing, Settings, etc.
 */
export function setLanguage(lng: 'en' | 'he'): void {
  i18n.changeLanguage(lng);
}

/** Keep UI language (and logout flag) when clearing session storage on sign-out. */
export function clearAppStoragePreservingLanguage(): void {
  if (typeof window === 'undefined') return;
  const currentLang = (i18n.language || i18n.resolvedLanguage || '').split('-')[0];
  if (currentLang === 'he' || currentLang === 'en') {
    localStorage.setItem(STORAGE_KEY, currentLang);
  }
  const preserved: Record<string, string> = {};
  for (const key of PRESERVED_LOCAL_STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (value != null) preserved[key] = value;
  }
  try {
    localStorage.clear();
    sessionStorage.clear();
    for (const [key, value] of Object.entries(preserved)) {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.error('Error clearing storage:', e);
  }
}

export { STORAGE_KEY };
