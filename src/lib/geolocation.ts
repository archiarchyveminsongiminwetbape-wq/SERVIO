/**
 * Geolocation and region detection utilities
 * Automatically detects user location and adapts the application accordingly
 */

export interface LocationData {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  currency: string;
  language: string;
  continent: string;
}

export const detectLocation = async (): Promise<LocationData | null> => {
  try {
    // Try to get location from browser geolocation API
    if (navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 3600000, // 1 hour cache
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use reverse geocoding API (using a free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
      );
      const data = await response.json();

      if (data.address) {
        return {
          country: data.address.country || '',
          countryCode: data.address.country_code?.toUpperCase() || '',
          region: data.address.state || data.address.region || '',
          city: data.address.city || data.address.town || data.address.village || '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          currency: getCurrencyForCountry(data.address.country_code?.toUpperCase() || ''),
          language: getLanguageForCountry(data.address.country_code?.toUpperCase() || ''),
          continent: getContinentForCountry(data.address.country_code?.toUpperCase() || ''),
        };
      }
    }
  } catch (error) {
    console.log('Geolocation not available or denied, falling back to IP-based detection');
  }

  // Fallback to IP-based detection
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    return {
      country: data.country_name || '',
      countryCode: data.country_code?.toUpperCase() || '',
      region: data.region || '',
      city: data.city || '',
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: data.currency || 'USD',
      language: getLanguageForCountry(data.country_code?.toUpperCase() || ''),
      continent: getContinentForCountry(data.country_code?.toUpperCase() || ''),
    };
  } catch (error) {
    console.log('IP-based detection failed, using browser locale');
  }

  // Final fallback to browser locale
  const locale = navigator.language || 'en-US';
  const region = locale.split('-')[1] || 'US';

  return {
    country: getCountryName(region),
    countryCode: region,
    region: '',
    city: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: getCurrencyForCountry(region),
    language: locale.split('-')[0],
    continent: getContinentForCountry(region),
  };
};

const getCurrencyForCountry = (countryCode: string): string => {
  const currencyMap: Record<string, string> = {
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
  return currencyMap[countryCode] || 'USD';
};

const getLanguageForCountry = (countryCode: string): string => {
  const languageMap: Record<string, string> = {
    US: 'en',
    GB: 'en',
    CA: 'en',
    AU: 'en',
    FR: 'fr',
    DE: 'de',
    IT: 'it',
    ES: 'es',
    PT: 'pt',
    BR: 'pt',
    MX: 'es',
    JP: 'ja',
    CN: 'zh',
    KR: 'ko',
    SA: 'ar',
    AE: 'ar',
    EG: 'ar',
    CM: 'fr',
    SN: 'fr',
    RU: 'ru',
    IN: 'hi',
    ZA: 'en',
    NG: 'en',
  };
  return languageMap[countryCode] || 'en';
};

const getContinentForCountry = (countryCode: string): string => {
  const continentMap: Record<string, string> = {
    // North America
    US: 'NA',
    CA: 'CA',
    MX: 'NA',
    
    // South America
    BR: 'SA',
    AR: 'SA',
    CO: 'SA',
    
    // Europe
    GB: 'EU',
    FR: 'EU',
    DE: 'EU',
    IT: 'EU',
    ES: 'EU',
    PT: 'EU',
    NL: 'EU',
    BE: 'EU',
    AT: 'EU',
    GR: 'EU',
    RU: 'EU',
    
    // Asia
    JP: 'AS',
    CN: 'AS',
    KR: 'AS',
    IN: 'AS',
    
    // Middle East
    SA: 'ME',
    AE: 'ME',
    EG: 'ME',
    
    // Africa
    ZA: 'AF',
    NG: 'AF',
    CM: 'AF',
    SN: 'AF',
    
    // Oceania
    AU: 'OC',
    NZ: 'OC',
  };
  return continentMap[countryCode] || 'NA';
};

const getCountryName = (countryCode: string): string => {
  const countryNames: Record<string, string> = {
    US: 'United States',
    CA: 'Canada',
    GB: 'United Kingdom',
    AU: 'Australia',
    JP: 'Japan',
    CN: 'China',
    KR: 'South Korea',
    SA: 'Saudi Arabia',
    AE: 'United Arab Emirates',
    BR: 'Brazil',
    MX: 'Mexico',
    IN: 'India',
    RU: 'Russia',
    ZA: 'South Africa',
    NG: 'Nigeria',
    EG: 'Egypt',
    CM: 'Cameroon',
    SN: 'Senegal',
    FR: 'France',
    DE: 'Germany',
    IT: 'Italy',
    ES: 'Spain',
    PT: 'Portugal',
    BE: 'Belgium',
    NL: 'Netherlands',
    AT: 'Austria',
    GR: 'Greece',
  };
  return countryNames[countryCode] || 'Unknown';
};

export const getTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

export const isInDST = (): boolean => {
  const date = new Date();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Simple DST detection for Northern Hemisphere
  // DST typically runs from March to November
  if (month > 2 && month < 10) {
    return true;
  }
  if (month === 2 && day >= 8) {
    return true;
  }
  if (month === 10 && day < 1) {
    return true;
  }
  
  return false;
};

export const getLocalTime = (timezone: string): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
};
