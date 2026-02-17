import i18n from './index';

const STORAGE_KEY = 'app_language';

/**
 * Central function for changing app language.
 * i18n's languageChanged listener handles: document.dir, document.lang, localStorage.
 * Use this everywhere - Landing, Settings, etc.
 */
export function setLanguage(lng: 'en' | 'he'): void {
  i18n.changeLanguage(lng);
}

export { STORAGE_KEY };
