/**
 * Locale-aware formatting utilities for dates, numbers, and currency
 * Supports all regions and languages used in the application
 */

export const formatDate = (date: Date | string, locale: string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(dateObj);
};

export const formatShortDate = (date: Date | string, locale: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

export const formatTime = (date: Date | string, locale: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

export const formatDateTime = (date: Date | string, locale: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

export const formatRelativeTime = (date: Date | string, locale: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffSeconds < 60) {
    return rtf.format(-diffSeconds, 'second');
  } else if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, 'minute');
  } else if (diffHours < 24) {
    return rtf.format(-diffHours, 'hour');
  } else if (diffDays < 30) {
    return rtf.format(-diffDays, 'day');
  } else if (diffMonths < 12) {
    return rtf.format(-diffMonths, 'month');
  } else {
    return rtf.format(-diffYears, 'year');
  }
};

export const formatNumber = (value: number, locale: string, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat(locale, options).format(value);
};

export const formatPercent = (value: number, locale: string, decimals: number = 1): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

export const formatDecimal = (value: number, locale: string, decimals: number = 2): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatCompactNumber = (value: number, locale: string): string => {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};

export const formatFileSize = (bytes: number, locale: string): string => {
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${formatDecimal(size, locale, 1)} ${units[unitIndex]}`;
};

export const formatPhoneNumber = (phone: string, locale: string): string => {
  // Basic phone formatting based on locale
  const cleaned = phone.replace(/\D/g, '');
  
  if (locale.startsWith('ar')) {
    // Arabic countries: +XXX XX XXX XXXX
    if (cleaned.length === 12) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
  } else if (locale.startsWith('fr') || locale.startsWith('de') || locale.startsWith('it')) {
    // European format: +XX XX XX XX XX
    if (cleaned.length >= 10) {
      const groups = cleaned.match(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
      if (groups) {
        return `+${groups.slice(1).join(' ')}`;
      }
    }
  } else if (locale.startsWith('en-US') || locale.startsWith('en-CA')) {
    // North American format: (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11) {
      return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
  } else if (locale.startsWith('zh')) {
    // Chinese format: +XXX XXXX XXXX
    if (cleaned.length === 11) {
      return `+${cleaned[0]} ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`;
    }
  } else if (locale.startsWith('ja') || locale.startsWith('ko')) {
    // Asian format: +XX-XXXX-XXXX
    if (cleaned.length === 11) {
      return `+${cleaned[0]}-${cleaned.slice(1, 5)}-${cleaned.slice(5)}`;
    }
  }
  
  // Fallback: return original
  return phone;
};

export const getLocaleFromLanguage = (language: string): string => {
  const localeMap: Record<string, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    es: 'es-ES',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-BR',
    ar: 'ar-SA',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ko: 'ko-KR',
  };
  return localeMap[language] || 'en-US';
};

export const isWeekend = (date: Date, locale: string): boolean => {
  const day = date.getDay();
  
  // In most Western countries, weekend is Saturday (6) and Sunday (0)
  // In some Middle Eastern countries, weekend is Friday (5) and Saturday (6)
  if (locale.startsWith('ar') || locale.startsWith('he')) {
    return day === 5 || day === 6; // Friday and Saturday
  }
  
  return day === 0 || day === 6; // Saturday and Sunday
};

export const getFirstDayOfWeek = (locale: string): number => {
  // 0 = Sunday, 1 = Monday, etc.
  if (locale.startsWith('ar') || locale.startsWith('he') || locale.startsWith('en-US')) {
    return 0; // Sunday
  }
  return 1; // Monday (most of Europe, Asia, etc.)
};
