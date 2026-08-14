import { Language, Translations } from './types';
import { rtlLanguages } from './config';
import { translations, defaultLanguage, supportedLanguages, getLocaleFromLanguage } from './translations';

export * from './types';
export * from './config';
export { supportedLanguages, defaultLanguage, getLocaleFromLanguage };

export const isRTL = (language: Language): boolean => rtlLanguages.includes(language);

export async function getTranslations(language: Language): Promise<Translations> {
  return translations[language] || translations[defaultLanguage] || translations['en'];
}

export function getInitialTranslations(language: Language): Translations {
  return translations[language] || translations[defaultLanguage] || translations['en'];
}

