import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Language, Translations, getTranslations, getInitialTranslations, isRTL, supportedLanguages, defaultLanguage, getLocaleFromLanguage } from '@/i18n';
import { Currency, detectCurrency, getCurrencyByCountry } from '@/lib/currency';
import { detectLocation, LocationData } from '@/lib/geolocation';
import { getThemeByCountry, getThemeByLanguage, applyCulturalTheme, CulturalTheme } from '@/lib/cultural-themes';

interface I18nContextType {
  language: Language;
  locale: string;
  isRTL: boolean;
  currency: Currency;
  location: LocationData | null;
  culturalTheme: CulturalTheme;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: Currency) => void;
  t: Translations;
  supportedLanguages: typeof supportedLanguages;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get language from localStorage
    const saved = localStorage.getItem('language') as Language;
    if (saved && supportedLanguages.find(l => l.code === saved)) {
      return saved;
    }
    // Try to get language from browser
    const browserLang = navigator.language.split('-')[0] as Language;
    if (supportedLanguages.find(l => l.code === browserLang)) {
      return browserLang;
    }
    return defaultLanguage;
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency') as Currency;
    if (saved) return saved;
    return detectCurrency();
  });

  const [location, setLocation] = useState<LocationData | null>(null);
  const [culturalTheme, setCulturalTheme] = useState(() => getThemeByLanguage(defaultLanguage));
  const [translations, setTranslations] = useState<Translations>(() => getInitialTranslations(defaultLanguage));

  // Load translations asynchronously
  useEffect(() => {
    getTranslations(language).then((trans) => {
      setTranslations(trans);
    }).catch((error) => {
      console.error(`Failed to load translations for ${language}:`, error);
    });
  }, [language]);

  // Detect location on mount
  useEffect(() => {
    detectLocation().then((detectedLocation) => {
      if (detectedLocation) {
        setLocation(detectedLocation);
        // Auto-set currency based on detected location
        if (!localStorage.getItem('currency')) {
          setCurrencyState(detectedLocation.currency as Currency);
        }
        // Auto-set cultural theme based on detected location
        const theme = getThemeByCountry(detectedLocation.countryCode);
        setCulturalTheme(theme);
        applyCulturalTheme(theme);
      }
    }).catch(() => {
      // Silently fail if location detection fails
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
    
    // Auto-update currency based on language/country
    const region = navigator.language.split('-')[1] || 'US';
    const suggestedCurrency = getCurrencyByCountry(region);
    setCurrencyState(suggestedCurrency);
    localStorage.setItem('currency', suggestedCurrency);
    
    // Auto-update cultural theme based on language
    const theme = getThemeByLanguage(lang);
    setCulturalTheme(theme);
    applyCulturalTheme(theme);
  }, []);

  const setCurrency = useCallback((curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('currency', curr);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL(language) ? 'rtl' : 'ltr';
  }, [language]);

  const locale = useMemo(() => getLocaleFromLanguage(language), [language]);
  const rtl = useMemo(() => isRTL(language), [language]);

  const value = useMemo(() => ({
    language,
    locale,
    isRTL: rtl,
    currency,
    location,
    culturalTheme,
    setLanguage,
    setCurrency,
    t: translations,
    supportedLanguages,
  }), [language, locale, rtl, currency, location, culturalTheme, setLanguage, setCurrency, translations]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
