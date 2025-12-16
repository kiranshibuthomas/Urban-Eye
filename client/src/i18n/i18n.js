import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import mlTranslations from './locales/ml.json';

const resources = {
  en: {
    translation: enTranslations
  },
  ml: {
    translation: mlTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

// Update HTML lang attribute when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.setAttribute('lang', lng);
});

// Set initial lang attribute
document.documentElement.setAttribute('lang', i18n.language || 'en');

export default i18n;