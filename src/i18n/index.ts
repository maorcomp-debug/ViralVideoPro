import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import he from './locales/he.json';

const STORAGE_KEY = 'app_language';

function applyDirection(lang: string) {
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  if (typeof document !== 'undefined') {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    fallbackLng: 'en',
    defaultNS: 'translation',
    supportedLngs: ['en', 'he'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
      convertDetectedLanguage: (lng: string) => {
        if (lng.startsWith('he')) return 'he';
        if (lng.startsWith('en')) return 'en';
        return 'en';
      },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lng);
  }
});

// Apply direction on init
const currentLng = i18n.language || i18n.resolvedLanguage || 'en';
applyDirection(currentLng);

export default i18n;
