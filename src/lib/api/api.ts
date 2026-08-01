// Main API Export - Consolidates all API modules
export { profilesApi } from './profiles';
export { providersApi } from './providers';
export { messagesApi } from './messages';
export { reviewsApi } from './reviews';
export { favoritesApi } from './favorites';
export { notificationsApi } from './notifications';
export { categoriesApi } from './categories';
export { portfolioApi } from './portfolio';
export { validators, schemas, validateSchema, type ValidationError, type ValidationResult } from './validation';

// Re-export types and utilities
export { supabase, handleApiError, handleApiSuccess, handleApiFailure, type ApiResponse } from './index';
