import { Language, Translations } from './types';
import { rtlLanguages } from './config';
import en from './translations/en';

export const isRTL = (language: Language): boolean => rtlLanguages.includes(language);

export const defaultLanguage: Language = 'en';
export const supportedLanguages = [
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it' as Language, name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt' as Language, name: 'Português', flag: '🇵🇹' },
  { code: 'ar' as Language, name: 'العربية', flag: '🇸🇦' },
  { code: 'zh' as Language, name: '中文', flag: '🇨🇳' },
  { code: 'ja' as Language, name: '日本語', flag: '🇯🇵' },
  { code: 'ko' as Language, name: '한국어', flag: '🇰🇷' },
];

export const getLocaleFromLanguage = (language: Language): string => {
  const locales: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    es: 'es-ES',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-PT',
    ar: 'ar-SA',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ko: 'ko-KR',
  };
  return locales[language];
};

// Lazy load translations
const translationCache = new Map<Language, Translations>();

export async function getTranslations(language: Language): Promise<Translations> {
  if (translationCache.has(language)) {
    return translationCache.get(language)!;
  }

  try {
    const module = await import(`./translations/${language}.ts`);
    const translations = module.default as Translations;
    translationCache.set(language, translations);
    return translations;
  } catch (error) {
    console.error(`Failed to load translations for ${language}:`, error);
    // Fallback to English if loading fails
    if (language !== 'en') {
      return getTranslations('en');
    }
    throw error;
  }
}

// Synchronous fallback for initial render (only loads English)
export function getInitialTranslations(language: Language): Translations {
  if (translationCache.has(language)) {
    return translationCache.get(language)!;
  }
  // Return English translations as a safe fallback while the requested
  // language is loaded asynchronously, so components never receive an
  // empty object and crash on properties like `t.nav.home`.
  return en;
}
