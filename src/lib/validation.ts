// Validation utilities for form data and API requests

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validatePassword(password: string): ValidationResult {
  const errors: Record<string, string> = {};

  if (password.length < 8) {
    errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
  }

  if (!/[A-Z]/.test(password)) {
    errors.password = 'Le mot de passe doit contenir au moins une majuscule';
  }

  if (!/[a-z]/.test(password)) {
    errors.password = 'Le mot de passe doit contenir au moins une minuscule';
  }

  if (!/[0-9]/.test(password)) {
    errors.password = 'Le mot de passe doit contenir au moins un chiffre';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateBookingData(data: {
  date: string;
  time: string;
  notes?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.date) {
    errors.date = 'La date est requise';
  }

  if (!data.time) {
    errors.time = 'L\'heure est requise';
  }

  if (data.date && new Date(data.date) < new Date()) {
    errors.date = 'La date doit être dans le futur';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateProviderProfile(data: {
  business_name: string;
  headline: string;
  description: string;
  city: string;
  category_id?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.business_name || data.business_name.trim().length < 2) {
    errors.business_name = 'Le nom de l\'entreprise doit contenir au moins 2 caractères';
  }

  if (!data.headline || data.headline.trim().length < 10) {
    errors.headline = 'Le titre doit contenir au moins 10 caractères';
  }

  if (!data.description || data.description.trim().length < 50) {
    errors.description = 'La description doit contenir au moins 50 caractères';
  }

  if (!data.city || data.city.trim().length < 2) {
    errors.city = 'La ville est requise';
  }

  if (!data.category_id) {
    errors.category_id = 'La catégorie est requise';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePortfolioItem(data: {
  title: string;
  description?: string;
  category?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'Le titre doit contenir au moins 3 caractères';
  }

  if (data.description && data.description.trim().length > 500) {
    errors.description = 'La description ne doit pas dépasser 500 caractères';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - for production use DOMPurify
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}

export function validateFileSize(file: File, maxSizeMB: number = 5): ValidationResult {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const errors: Record<string, string> = {};

  if (file.size > maxSizeBytes) {
    errors.file = `Le fichier ne doit pas dépasser ${maxSizeMB}MB`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateImageFile(file: File): ValidationResult {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const errors: Record<string, string> = {};

  if (!allowedTypes.includes(file.type)) {
    errors.file = 'Le fichier doit être une image (JPEG, PNG, GIF, WebP)';
  }

  const sizeValidation = validateFileSize(file, 5);
  if (!sizeValidation.valid) {
    errors.file = sizeValidation.errors.file;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateVideoFile(file: File): ValidationResult {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const errors: Record<string, string> = {};

  if (!allowedTypes.includes(file.type)) {
    errors.file = 'Le fichier doit être une vidéo (MP4, WebM, MOV)';
  }

  const sizeValidation = validateFileSize(file, 50);
  if (!sizeValidation.valid) {
    errors.file = sizeValidation.errors.file;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
