export interface Currency {
  code: string;
  name: string;
  nameEn: string;
  symbol: string;
  decimalPlaces: number;
  rateToUSD: number; // Taux de change par rapport au USD
  lastUpdated: string;
}

export const currencies: Currency[] = [
  // Europe
  { code: 'EUR', name: 'Euro', nameEn: 'Euro', symbol: '€', decimalPlaces: 2, rateToUSD: 1.08, lastUpdated: '2024-01-15' },
  { code: 'GBP', name: 'Livre sterling', nameEn: 'Pound Sterling', symbol: '£', decimalPlaces: 2, rateToUSD: 1.27, lastUpdated: '2024-01-15' },
  { code: 'CHF', name: 'Franc suisse', nameEn: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, rateToUSD: 1.15, lastUpdated: '2024-01-15' },
  { code: 'SEK', name: 'Couronne suédoise', nameEn: 'Swedish Krona', symbol: 'kr', decimalPlaces: 2, rateToUSD: 0.097, lastUpdated: '2024-01-15' },
  { code: 'NOK', name: 'Couronne norvégienne', nameEn: 'Norwegian Krone', symbol: 'kr', decimalPlaces: 2, rateToUSD: 0.093, lastUpdated: '2024-01-15' },
  { code: 'DKK', name: 'Couronne danoise', nameEn: 'Danish Krone', symbol: 'kr', decimalPlaces: 2, rateToUSD: 0.145, lastUpdated: '2024-01-15' },
  { code: 'PLN', name: 'Złoty', nameEn: 'Polish Złoty', symbol: 'zł', decimalPlaces: 2, rateToUSD: 0.25, lastUpdated: '2024-01-15' },
  { code: 'CZK', name: 'Couronne tchèque', nameEn: 'Czech Koruna', symbol: 'Kč', decimalPlaces: 2, rateToUSD: 0.045, lastUpdated: '2024-01-15' },
  { code: 'HUF', name: 'Forint', nameEn: 'Hungarian Forint', symbol: 'Ft', decimalPlaces: 0, rateToUSD: 0.0028, lastUpdated: '2024-01-15' },
  { code: 'RON', name: 'Leu', nameEn: 'Romanian Leu', symbol: 'lei', decimalPlaces: 2, rateToUSD: 0.22, lastUpdated: '2024-01-15' },
  { code: 'BGN', name: 'Lev', nameEn: 'Bulgarian Lev', symbol: 'лв', decimalPlaces: 2, rateToUSD: 0.55, lastUpdated: '2024-01-15' },
  { code: 'HRK', name: 'Kuna', nameEn: 'Croatian Kuna', symbol: 'kn', decimalPlaces: 2, rateToUSD: 0.14, lastUpdated: '2024-01-15' },
  
  // Amérique du Nord
  { code: 'USD', name: 'Dollar américain', nameEn: 'US Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 1.00, lastUpdated: '2024-01-15' },
  { code: 'CAD', name: 'Dollar canadien', nameEn: 'Canadian Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 0.74, lastUpdated: '2024-01-15' },
  { code: 'MXN', name: 'Peso mexicain', nameEn: 'Mexican Peso', symbol: '$', decimalPlaces: 2, rateToUSD: 0.059, lastUpdated: '2024-01-15' },
  
  // Amérique centrale et Caraïbes
  { code: 'CRC', name: 'Colon costaricien', nameEn: 'Costa Rican Colón', symbol: '₡', decimalPlaces: 0, rateToUSD: 0.0019, lastUpdated: '2024-01-15' },
  { code: 'PAB', name: 'Balboa', nameEn: 'Panamanian Balboa', symbol: 'B/.', decimalPlaces: 2, rateToUSD: 1.00, lastUpdated: '2024-01-15' },
  { code: 'CUP', name: 'Peso cubain', nameEn: 'Cuban Peso', symbol: '$', decimalPlaces: 2, rateToUSD: 0.042, lastUpdated: '2024-01-15' },
  { code: 'DOP', name: 'Peso dominicain', nameEn: 'Dominican Peso', symbol: '$', decimalPlaces: 2, rateToUSD: 0.018, lastUpdated: '2024-01-15' },
  { code: 'JMD', name: 'Dollar jamaïcain', nameEn: 'Jamaican Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 0.0064, lastUpdated: '2024-01-15' },
  
  // Amérique du Sud
  { code: 'BRL', name: 'Real brésilien', nameEn: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2, rateToUSD: 0.20, lastUpdated: '2024-01-15' },
  { code: 'ARS', name: 'Peso argentin', nameEn: 'Argentine Peso', symbol: '$', decimalPlaces: 2, rateToUSD: 0.0028, lastUpdated: '2024-01-15' },
  { code: 'CLP', name: 'Peso chilien', nameEn: 'Chilean Peso', symbol: '$', decimalPlaces: 0, rateToUSD: 0.0011, lastUpdated: '2024-01-15' },
  { code: 'COP', name: 'Peso colombien', nameEn: 'Colombian Peso', symbol: '$', decimalPlaces: 0, rateToUSD: 0.00025, lastUpdated: '2024-01-15' },
  { code: 'PEN', name: 'Sol', nameEn: 'Peruvian Sol', symbol: 'S/', decimalPlaces: 2, rateToUSD: 0.27, lastUpdated: '2024-01-15' },
  { code: 'VES', name: 'Bolívar', nameEn: 'Venezuelan Bolívar', symbol: 'Bs', decimalPlaces: 2, rateToUSD: 0.028, lastUpdated: '2024-01-15' },
  { code: 'BOB', name: 'Boliviano', nameEn: 'Bolivian Boliviano', symbol: 'Bs', decimalPlaces: 2, rateToUSD: 0.14, lastUpdated: '2024-01-15' },
  { code: 'PYG', name: 'Guaraní', nameEn: 'Paraguayan Guaraní', symbol: '₲', decimalPlaces: 0, rateToUSD: 0.00014, lastUpdated: '2024-01-15' },
  { code: 'UYU', name: 'Peso uruguayen', nameEn: 'Uruguayan Peso', symbol: '$', decimalPlaces: 2, rateToUSD: 0.026, lastUpdated: '2024-01-15' },
  { code: 'GYD', name: 'Dollar guyanien', nameEn: 'Guyanese Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 0.0048, lastUpdated: '2024-01-15' },
  { code: 'SRD', name: 'Dollar surinamien', nameEn: 'Surinamese Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 0.028, lastUpdated: '2024-01-15' },
  
  // Afrique
  { code: 'MAD', name: 'Dirham marocain', nameEn: 'Moroccan Dirham', symbol: 'DH', decimalPlaces: 2, rateToUSD: 0.10, lastUpdated: '2024-01-15' },
  { code: 'DZD', name: 'Dinar algérien', nameEn: 'Algerian Dinar', symbol: 'DA', decimalPlaces: 2, rateToUSD: 0.0074, lastUpdated: '2024-01-15' },
  { code: 'TND', name: 'Dinar tunisien', nameEn: 'Tunisian Dinar', symbol: 'DT', decimalPlaces: 3, rateToUSD: 0.32, lastUpdated: '2024-01-15' },
  { code: 'EGP', name: 'Livre égyptienne', nameEn: 'Egyptian Pound', symbol: 'E£', decimalPlaces: 2, rateToUSD: 0.032, lastUpdated: '2024-01-15' },
  { code: 'ZAR', name: 'Rand', nameEn: 'South African Rand', symbol: 'R', decimalPlaces: 2, rateToUSD: 0.053, lastUpdated: '2024-01-15' },
  { code: 'NGN', name: 'Naira', nameEn: 'Nigerian Naira', symbol: '₦', decimalPlaces: 2, rateToUSD: 0.00064, lastUpdated: '2024-01-15' },
  { code: 'KES', name: 'Shilling kényan', nameEn: 'Kenyan Shilling', symbol: 'KSh', decimalPlaces: 2, rateToUSD: 0.0064, lastUpdated: '2024-01-15' },
  { code: 'GHS', name: 'Cedi ghanéen', nameEn: 'Ghanaian Cedi', symbol: 'GH₵', decimalPlaces: 2, rateToUSD: 0.092, lastUpdated: '2024-01-15' },
  { code: 'XOF', name: 'Franc CFA', nameEn: 'West African CFA Franc', symbol: 'CFA', decimalPlaces: 0, rateToUSD: 0.0016, lastUpdated: '2024-01-15' },
  { code: 'XAF', name: 'Franc CFA', nameEn: 'Central African CFA Franc', symbol: 'CFA', decimalPlaces: 0, rateToUSD: 0.0016, lastUpdated: '2024-01-15' },
  { code: 'ETB', name: 'Birr', nameEn: 'Ethiopian Birr', symbol: 'Br', decimalPlaces: 2, rateToUSD: 0.018, lastUpdated: '2024-01-15' },
  { code: 'TZS', name: 'Shilling tanzanien', nameEn: 'Tanzanian Shilling', symbol: 'TSh', decimalPlaces: 0, rateToUSD: 0.00039, lastUpdated: '2024-01-15' },
  { code: 'UGX', name: 'Shilling ougandais', nameEn: 'Ugandan Shilling', symbol: 'USh', decimalPlaces: 0, rateToUSD: 0.00027, lastUpdated: '2024-01-15' },
  { code: 'RWF', name: 'Franc rwandais', nameEn: 'Rwandan Franc', symbol: 'R₣', decimalPlaces: 0, rateToUSD: 0.00083, lastUpdated: '2024-01-15' },
  { code: 'MUR', name: 'Roupie mauricienne', nameEn: 'Mauritian Rupee', symbol: '₨', decimalPlaces: 2, rateToUSD: 0.022, lastUpdated: '2024-01-15' },
  
  // Asie
  { code: 'CNY', name: 'Yuan', nameEn: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, rateToUSD: 0.14, lastUpdated: '2024-01-15' },
  { code: 'JPY', name: 'Yen', nameEn: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, rateToUSD: 0.0067, lastUpdated: '2024-01-15' },
  { code: 'KRW', name: 'Won', nameEn: 'South Korean Won', symbol: '₩', decimalPlaces: 0, rateToUSD: 0.00075, lastUpdated: '2024-01-15' },
  { code: 'INR', name: 'Roupie indienne', nameEn: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, rateToUSD: 0.012, lastUpdated: '2024-01-15' },
  { code: 'IDR', name: 'Roupie indonésienne', nameEn: 'Indonesian Rupiah', symbol: 'Rp', decimalPlaces: 0, rateToUSD: 0.000064, lastUpdated: '2024-01-15' },
  { code: 'MYR', name: 'Ringgit', nameEn: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2, rateToUSD: 0.21, lastUpdated: '2024-01-15' },
  { code: 'SGD', name: 'Dollar de Singapour', nameEn: 'Singapore Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 0.74, lastUpdated: '2024-01-15' },
  { code: 'THB', name: 'Baht', nameEn: 'Thai Baht', symbol: '฿', decimalPlaces: 2, rateToUSD: 0.028, lastUpdated: '2024-01-15' },
  { code: 'VND', name: 'Dông', nameEn: 'Vietnamese Dong', symbol: '₫', decimalPlaces: 0, rateToUSD: 0.000041, lastUpdated: '2024-01-15' },
  { code: 'PHP', name: 'Peso philippin', nameEn: 'Philippine Peso', symbol: '₱', decimalPlaces: 2, rateToUSD: 0.018, lastUpdated: '2024-01-15' },
  { code: 'HKD', name: 'Dollar de Hong Kong', nameEn: 'Hong Kong Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 0.13, lastUpdated: '2024-01-15' },
  { code: 'TWD', name: 'Dollar taïwanais', nameEn: 'Taiwan Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 0.032, lastUpdated: '2024-01-15' },
  { code: 'BDT', name: 'Taka', nameEn: 'Bangladeshi Taka', symbol: '৳', decimalPlaces: 2, rateToUSD: 0.0091, lastUpdated: '2024-01-15' },
  { code: 'PKR', name: 'Roupie pakistanaise', nameEn: 'Pakistani Rupee', symbol: '₨', decimalPlaces: 2, rateToUSD: 0.0036, lastUpdated: '2024-01-15' },
  { code: 'LKR', name: 'Roupie srilankaise', nameEn: 'Sri Lankan Rupee', symbol: 'Rs', decimalPlaces: 2, rateToUSD: 0.0032, lastUpdated: '2024-01-15' },
  { code: 'NPR', name: 'Roupie népalaise', nameEn: 'Nepalese Rupee', symbol: '₨', decimalPlaces: 2, rateToUSD: 0.0075, lastUpdated: '2024-01-15' },
  { code: 'MMK', name: 'Kyat', nameEn: 'Myanmar Kyat', symbol: 'K', decimalPlaces: 0, rateToUSD: 0.00048, lastUpdated: '2024-01-15' },
  { code: 'KHR', name: 'Riel', nameEn: 'Cambodian Riel', symbol: '៛', decimalPlaces: 0, rateToUSD: 0.00025, lastUpdated: '2024-01-15' },
  { code: 'LAK', name: 'Kip', nameEn: 'Lao Kip', symbol: '₭', decimalPlaces: 0, rateToUSD: 0.000048, lastUpdated: '2024-01-15' },
  { code: 'BND', name: 'Dollar de Brunei', nameEn: 'Brunei Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 0.74, lastUpdated: '2024-01-15' },
  { code: 'MNT', name: 'Tugrik', nameEn: 'Mongolian Tugrik', symbol: '₮', decimalPlaces: 0, rateToUSD: 0.00037, lastUpdated: '2024-01-15' },
  { code: 'KZT', name: 'Tenge', nameEn: 'Kazakhstan Tenge', symbol: '₸', decimalPlaces: 2, rateToUSD: 0.0022, lastUpdated: '2024-01-15' },
  { code: 'UZS', name: 'Soum', nameEn: 'Uzbekistan Sum', symbol: 'so\'m', decimalPlaces: 0, rateToUSD: 0.000080, lastUpdated: '2024-01-15' },
  { code: 'AFN', name: 'Afghani', nameEn: 'Afghan Afghani', symbol: '؋', decimalPlaces: 0, rateToUSD: 0.014, lastUpdated: '2024-01-15' },
  { code: 'IRR', name: 'Rial', nameEn: 'Iranian Rial', symbol: '﷼', decimalPlaces: 0, rateToUSD: 0.000024, lastUpdated: '2024-01-15' },
  { code: 'SAR', name: 'Riyal', nameEn: 'Saudi Riyal', symbol: '﷼', decimalPlaces: 2, rateToUSD: 0.27, lastUpdated: '2024-01-15' },
  { code: 'AED', name: 'Dirham', nameEn: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2, rateToUSD: 0.27, lastUpdated: '2024-01-15' },
  { code: 'QAR', name: 'Riyal qatari', nameEn: 'Qatari Riyal', symbol: '﷼', decimalPlaces: 2, rateToUSD: 0.27, lastUpdated: '2024-01-15' },
  { code: 'KWD', name: 'Dinar koweïtien', nameEn: 'Kuwaiti Dinar', symbol: 'د.ك', decimalPlaces: 3, rateToUSD: 3.25, lastUpdated: '2024-01-15' },
  { code: 'BHD', name: 'Dinar bahreïni', nameEn: 'Bahraini Dinar', symbol: 'BD', decimalPlaces: 3, rateToUSD: 2.65, lastUpdated: '2024-01-15' },
  { code: 'OMR', name: 'Rial omanais', nameEn: 'Omani Rial', symbol: '﷼', decimalPlaces: 3, rateToUSD: 2.60, lastUpdated: '2024-01-15' },
  { code: 'YER', name: 'Rial yéménite', nameEn: 'Yemeni Rial', symbol: '﷼', decimalPlaces: 0, rateToUSD: 0.0040, lastUpdated: '2024-01-15' },
  { code: 'JOD', name: 'Dinar jordanien', nameEn: 'Jordanian Dinar', symbol: 'د.ا', decimalPlaces: 3, rateToUSD: 1.41, lastUpdated: '2024-01-15' },
  { code: 'LBP', name: 'Livre libanaise', nameEn: 'Lebanese Pound', symbol: 'ل.ل', decimalPlaces: 0, rateToUSD: 0.000066, lastUpdated: '2024-01-15' },
  { code: 'SYP', name: 'Livre syrienne', nameEn: 'Syrian Pound', symbol: '£', decimalPlaces: 0, rateToUSD: 0.00077, lastUpdated: '2024-01-15' },
  { code: 'IQD', name: 'Dinar irakien', nameEn: 'Iraqi Dinar', symbol: 'د.ع', decimalPlaces: 0, rateToUSD: 0.00077, lastUpdated: '2024-01-15' },
  { code: 'TRY', name: 'Livre turque', nameEn: 'Turkish Lira', symbol: '₺', decimalPlaces: 2, rateToUSD: 0.032, lastUpdated: '2024-01-15' },
  { code: 'ILS', name: 'Shekel', nameEn: 'Israeli Shekel', symbol: '₪', decimalPlaces: 2, rateToUSD: 0.27, lastUpdated: '2024-01-15' },
  
  // Océanie
  { code: 'AUD', name: 'Dollar australien', nameEn: 'Australian Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 0.65, lastUpdated: '2024-01-15' },
  { code: 'NZD', name: 'Dollar néo-zélandais', nameEn: 'New Zealand Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 0.60, lastUpdated: '2024-01-15' },
  { code: 'FJD', name: 'Dollar fidjien', nameEn: 'Fijian Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 0.45, lastUpdated: '2024-01-15' },
  { code: 'PGK', name: 'Kina', nameEn: 'Papua New Guinea Kina', symbol: 'K', decimalPlaces: 2, rateToUSD: 0.28, lastUpdated: '2024-01-15' },
  { code: 'VUV', name: 'Vatu', nameEn: 'Vanuatu Vatu', symbol: 'Vt', decimalPlaces: 0, rateToUSD: 0.0084, lastUpdated: '2024-01-15' },
  { code: 'SBD', name: 'Dollar des îles Salomon', nameEn: 'Solomon Islands Dollar', symbol: '$', decimalPlaces: 2, rateToUSD: 0.12, lastUpdated: '2024-01-15' },
];

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return currencies.find(c => c.code === code);
};

export const formatCurrency = (amount: number, currencyCode: string, locale: string = 'fr-FR'): string => {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) return amount.toString();
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  }).format(amount);
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  const from = getCurrencyByCode(fromCurrency);
  const to = getCurrencyByCode(toCurrency);
  
  if (!from || !to) return amount;
  
  // Convertir en USD d'abord, puis vers la devise cible
  const amountInUSD = amount / from.rateToUSD;
  const convertedAmount = amountInUSD * to.rateToUSD;
  
  return convertedAmount;
};

export const searchCurrencies = (query: string): Currency[] => {
  const lowerQuery = query.toLowerCase();
  return currencies.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    c.nameEn.toLowerCase().includes(lowerQuery) ||
    c.code.toLowerCase().includes(lowerQuery)
  );
};
