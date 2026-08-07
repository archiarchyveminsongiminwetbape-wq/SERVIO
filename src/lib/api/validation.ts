// Data Validation Utilities
export const validators = {
  // Email validation
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone validation (French format)
  phone: (phone: string): boolean => {
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(phone);
  },

  // URL validation
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Rating validation (1-5)
  rating: (rating: number): boolean => {
    return rating >= 1 && rating <= 5 && Number.isInteger(rating);
  },

  // Price range validation
  priceRange: (price: string): boolean => {
    const validRanges = ['€', '€€', '€€€', '€€€€'];
    return validRanges.includes(price);
  },

  // Slug validation
  slug: (slug: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  },

  // Required field validation
  required: (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  // String length validation
  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },

  // Number range validation
  min: (value: number, min: number): boolean => {
    return value >= min;
  },

  max: (value: number, max: number): boolean => {
    return value <= max;
  }
};

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Validation schemas
export const schemas = {
  profile: {
    full_name: (value: string): ValidationError | null => {
      if (!validators.required(value)) {
        return { field: 'full_name', message: 'Le nom complet est requis' };
      }
      if (!validators.minLength(value, 2)) {
        return { field: 'full_name', message: 'Le nom doit contenir au moins 2 caractères' };
      }
      if (!validators.maxLength(value, 100)) {
        return { field: 'full_name', message: 'Le nom ne peut pas dépasser 100 caractères' };
      }
      return null;
    },
    email: (value: string): ValidationError | null => {
      if (!validators.required(value)) {
        return { field: 'email', message: 'L\'email est requis' };
      }
      if (!validators.email(value)) {
        return { field: 'email', message: 'L\'email n\'est pas valide' };
      }
      return null;
    },
    phone: (value: string | null): ValidationError | null => {
      if (value && !validators.phone(value)) {
        return { field: 'phone', message: 'Le numéro de téléphone n\'est pas valide' };
      }
      return null;
    }
  },

  providerProfile: {
    business_name: (value: string): ValidationError | null => {
      if (!validators.required(value)) {
        return { field: 'business_name', message: 'Le nom de l\'entreprise est requis' };
      }
      if (!validators.minLength(value, 2)) {
        return { field: 'business_name', message: 'Le nom doit contenir au moins 2 caractères' };
      }
      if (!validators.maxLength(value, 100)) {
        return { field: 'business_name', message: 'Le nom ne peut pas dépasser 100 caractères' };
      }
      return null;
    },
    headline: (value: string | null): ValidationError | null => {
      if (value && !validators.maxLength(value, 200)) {
        return { field: 'headline', message: 'Le titre ne peut pas dépasser 200 caractères' };
      }
      return null;
    },
    description: (value: string | null): ValidationError | null => {
      if (value && !validators.maxLength(value, 5000)) {
        return { field: 'description', message: 'La description ne peut pas dépasser 5000 caractères' };
      }
      return null;
    },
    city: (value: string | null): ValidationError | null => {
      if (value && !validators.minLength(value, 2)) {
        return { field: 'city', message: 'La ville doit contenir au moins 2 caractères' };
      }
      return null;
    },
    price_range: (value: string | null): ValidationError | null => {
      if (value && !validators.priceRange(value)) {
        return { field: 'price_range', message: 'La gamme de prix n\'est pas valide' };
      }
      return null;
    },
    website: (value: string | null): ValidationError | null => {
      if (value && !validators.url(value)) {
        return { field: 'website', message: 'L\'URL du site web n\'est pas valide' };
      }
      return null;
    },
    experience_years: (value: number | null): ValidationError | null => {
      if (value !== null && value !== undefined) {
        if (!validators.min(value, 0)) {
          return { field: 'experience_years', message: 'L\'expérience ne peut pas être négative' };
        }
        if (!validators.max(value, 50)) {
          return { field: 'experience_years', message: 'L\'expérience ne peut pas dépasser 50 ans' };
        }
      }
      return null;
    }
  },

  review: {
    rating: (value: number): ValidationError | null => {
      if (!validators.required(value)) {
        return { field: 'rating', message: 'La note est requise' };
      }
      if (!validators.rating(value)) {
        return { field: 'rating', message: 'La note doit être entre 1 et 5' };
      }
      return null;
    },
    comment: (value: string | null): ValidationError | null => {
      if (value && !validators.minLength(value, 10)) {
        return { field: 'comment', message: 'Le commentaire doit contenir au moins 10 caractères' };
      }
      if (value && !validators.maxLength(value, 1000)) {
        return { field: 'comment', message: 'Le commentaire ne peut pas dépasser 1000 caractères' };
      }
      return null;
    }
  },

  message: {
    content: (value: string): ValidationError | null => {
      if (!validators.required(value)) {
        return { field: 'content', message: 'Le message est requis' };
      }
      if (!validators.minLength(value, 1)) {
        return { field: 'content', message: 'Le message ne peut pas être vide' };
      }
      if (!validators.maxLength(value, 5000)) {
        return { field: 'content', message: 'Le message ne peut pas dépasser 5000 caractères' };
      }
      return null;
    }
  }
};

// Generic validation function
export function validateSchema(
  schema: Record<string, (value: any) => ValidationError | null>,
  data: Record<string, any>
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, validator] of Object.entries(schema)) {
    const error = validator(data[field]);
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
