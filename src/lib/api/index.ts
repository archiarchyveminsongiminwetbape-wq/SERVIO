// API Client pour Supabase - Backend Functions
import { supabase } from '@/lib/supabase';
import type { 
  ProviderProfile, 
  Conversation, 
  Message, 
  Review, 
  Favorite, 
  Notification,
  Profile 
} from '@/types';

// Generic API Response Type
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

// Generic error handler
function handleApiError(error: any): string {
  if (error?.message) return error.message;
  if (error?.error_description) return error.error_description;
  return 'Une erreur est survenue';
}

// Generic success handler
function handleApiSuccess<T>(data: T): ApiResponse<T> {
  return { data, error: null, success: true };
}

// Generic error response
function handleApiFailure(error: any): ApiResponse<never> {
  return { data: null, error: handleApiError(error), success: false };
}

export { supabase, handleApiError, handleApiSuccess, handleApiFailure };
