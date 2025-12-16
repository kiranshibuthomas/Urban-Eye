import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useLanguageStyles = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const updateLanguageClass = (language) => {
      // Remove existing language classes
      document.documentElement.classList.remove('lang-en', 'lang-ml');
      
      // Add current language class
      document.documentElement.classList.add(`lang-${language}`);
      
      // Set lang attribute
      document.documentElement.setAttribute('lang', language);
    };

    // Set initial language
    updateLanguageClass(i18n.language);

    // Listen for language changes
    const handleLanguageChange = (lng) => {
      updateLanguageClass(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    // Cleanup
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return {
    currentLanguage: i18n.language,
    ismalayalam: i18n.language === 'ml',
    isEnglish: i18n.language === 'en'
  };
};

export default useLanguageStyles;