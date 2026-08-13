export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'KRW' | 'SAR' | 'AED' | 'CAD' | 'AUD' | 'BRL' | 'MXN' | 'INR' | 'RUB' | 'ZAR' | 'NGN' | 'EGP' | 'XAF' | 'XOF';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
  decimalPlaces: number;
}

export const currencies: Record<Currency, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimalPlaces: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', decimalPlaces: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', decimalPlaces: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimalPlaces: 0 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN', decimalPlaces: 2 },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR', decimalPlaces: 0 },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA', decimalPlaces: 2 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', decimalPlaces: 2 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', decimalPlaces: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', decimalPlaces: 2 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR', decimalPlaces: 2 },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX', decimalPlaces: 2 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'hi-IN', decimalPlaces: 2 },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU', decimalPlaces: 2 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA', decimalPlaces: 2 },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG', decimalPlaces: 2 },
  EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', locale: 'ar-EG', decimalPlaces: 2 },
  XAF: { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc BEAC', locale: 'fr-CM', decimalPlaces: 0 },
  XOF: { code: 'XOF', symbol: 'CFA', name: 'CFA Franc BCEAO', locale: 'fr-SN', decimalPlaces: 0 },
};

export const getCurrencyByCountry = (countryCode: string): Currency => {
  const countryCurrencyMap: Record<string, Currency> = {
    US: 'USD',
    CA: 'CAD',
    GB: 'GBP',
    AU: 'AUD',
    JP: 'JPY',
    CN: 'CNY',
    KR: 'KRW',
    SA: 'SAR',
    AE: 'AED',
    BR: 'BRL',
    MX: 'MXN',
    IN: 'INR',
    RU: 'RUB',
    ZA: 'ZAR',
    NG: 'NGN',
    EG: 'EGP',
    CM: 'XAF',
    SN: 'XOF',
    FR: 'EUR',
    DE: 'EUR',
    IT: 'EUR',
    ES: 'EUR',
    PT: 'EUR',
    BE: 'EUR',
    NL: 'EUR',
    AT: 'EUR',
    GR: 'EUR',
  };
  
  return countryCurrencyMap[countryCode] || 'USD';
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  const currencyInfo = currencies[currency];
  return new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currencyInfo.decimalPlaces,
    maximumFractionDigits: currencyInfo.decimalPlaces,
  }).format(amount);
};

export const detectCurrency = (): Currency => {
  const locale = navigator.language || 'en-US';
  const region = locale.split('-')[1] || 'US';
  return getCurrencyByCountry(region);
};
