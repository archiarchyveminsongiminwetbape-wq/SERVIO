/**
 * Cultural color theme utilities
 * Adapts color schemes based on cultural preferences and regional contexts
 */

export interface CulturalTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  success: string;
  warning: string;
  error: string;
  name: string;
}

export const culturalThemes: Record<string, CulturalTheme> = {
  // Western (Europe, North America) - Clean, professional blues and greens
  western: {
    primary: '#2563eb',
    secondary: '#475569',
    accent: '#0891b2',
    background: '#ffffff',
    text: '#1f2937',
    success: '#16a34a',
    warning: '#ca8a04',
    error: '#dc2626',
    name: 'Western',
  },
  
  // East Asian (China, Japan, Korea) - Red and gold for prosperity
  eastAsian: {
    primary: '#dc2626',
    secondary: '#71717a',
    accent: '#d97706',
    background: '#fafafa',
    text: '#18181b',
    success: '#16a34a',
    warning: '#ca8a04',
    error: '#dc2626',
    name: 'East Asian',
  },
  
  // Middle Eastern - Rich colors with gold accents
  middleEastern: {
    primary: '#1e40af',
    secondary: '#525252',
    accent: '#b45309',
    background: '#fefce8',
    text: '#171717',
    success: '#15803d',
    warning: '#a16207',
    error: '#b91c1c',
    name: 'Middle Eastern',
  },
  
  // African - Warm earth tones
  african: {
    primary: '#c2410c',
    secondary: '#525252',
    accent: '#0d9488',
    background: '#fff7ed',
    text: '#1c1917',
    success: '#15803d',
    warning: '#a16207',
    error: '#b91c1c',
    name: 'African',
  },
  
  // Latin American - Vibrant, warm colors
  latinAmerican: {
    primary: '#be185d',
    secondary: '#525252',
    accent: '#ea580c',
    background: '#fff1f2',
    text: '#1c1917',
    success: '#16a34a',
    warning: '#ca8a04',
    error: '#dc2626',
    name: 'Latin American',
  },
  
  // South Asian - Rich jewel tones
  southAsian: {
    primary: '#7c3aed',
    secondary: '#525252',
    accent: '#f59e0b',
    background: '#faf5ff',
    text: '#1c1917',
    success: '#16a34a',
    warning: '#a16207',
    error: '#b91c1c',
    name: 'South Asian',
  },
};

export const getThemeByCountry = (countryCode: string): CulturalTheme => {
  const countryThemeMap: Record<string, string> = {
    // East Asia
    CN: 'eastAsian',
    JP: 'eastAsian',
    KR: 'eastAsian',
    TW: 'eastAsian',
    
    // Middle East
    SA: 'middleEastern',
    AE: 'middleEastern',
    IR: 'middleEastern',
    
    // Africa
    NG: 'african',
    ZA: 'african',
    KE: 'african',
    
    // Latin America
    BR: 'latinAmerican',
    MX: 'latinAmerican',
    AR: 'latinAmerican',
    CO: 'latinAmerican',
    
    // South Asia
    IN: 'southAsian',
    PK: 'southAsian',
    BD: 'southAsian',
    
    // Western (default)
    US: 'western',
    GB: 'western',
    FR: 'western',
    DE: 'western',
    IT: 'western',
    ES: 'western',
    CA: 'western',
    AU: 'western',
  };
  
  return culturalThemes[countryThemeMap[countryCode]] || culturalThemes.western;
};

export const getThemeByLanguage = (language: string): CulturalTheme => {
  const languageThemeMap: Record<string, string> = {
    zh: 'eastAsian',
    ja: 'eastAsian',
    ko: 'eastAsian',
    ar: 'middleEastern',
    pt: 'latinAmerican',
    hi: 'southAsian',
  };
  
  return culturalThemes[languageThemeMap[language]] || culturalThemes.western;
};

export const applyCulturalTheme = (theme: CulturalTheme) => {
  const root = document.documentElement;
  
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-secondary', theme.secondary);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-background', theme.background);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-success', theme.success);
  root.style.setProperty('--color-warning', theme.warning);
  root.style.setProperty('--color-error', theme.error);
};

export const getCulturalColorMeanings = (theme: string): string[] => {
  const meanings: Record<string, string[]> = {
    western: [
      'Blue: Trust and professionalism',
      'Green: Growth and harmony',
      'White: Cleanliness and purity',
    ],
    eastAsian: [
      'Red: Good fortune and joy',
      'Gold: Prosperity and wealth',
      'White: Purity and mourning',
    ],
    middleEastern: [
      'Blue: Protection and faith',
      'Gold: Luxury and prestige',
      'Green: Life and paradise',
    ],
    african: [
      'Earth tones: Connection to land',
      'Red: Vitality and energy',
      'Gold: Wealth and status',
    ],
    latinAmerican: [
      'Warm colors: Passion and energy',
      'Vibrant tones: Celebration',
      'Natural hues: Connection to nature',
    ],
    southAsian: [
      'Purple: Royalty and spirituality',
      'Gold: Prosperity and divinity',
      'Saffron: Purity and auspiciousness',
    ],
  };
  
  return meanings[theme] || meanings.western;
};
