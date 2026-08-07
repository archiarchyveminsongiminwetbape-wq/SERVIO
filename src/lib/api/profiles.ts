// Profile API Functions
import { supabase, handleApiSuccess, handleApiFailure, ApiResponse } from './index';
import type { Profile } from '@/types';

export const profilesApi = {
  // Get profile by ID
  async getProfile(userId: string): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Update profile
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Update avatar
  async updateAvatar(userId: string, avatarUrl: string): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Search profiles
  async searchProfiles(query: string, filters?: {
    role?: 'visitor' | 'provider' | 'admin';
    city?: string;
  }): Promise<ApiResponse<Profile[]>> {
    try {
      let dbQuery = supabase
        .from('profiles')
        .select('*');

      if (query) {
        dbQuery = dbQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
      }

      if (filters?.role) {
        dbQuery = dbQuery.eq('role', filters.role);
      }

      if (filters?.city) {
        dbQuery = dbQuery.ilike('city', `%${filters.city}%`);
      }

      const { data, error } = await dbQuery;

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Delete profile (admin only)
  async deleteProfile(userId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      return handleApiSuccess(null);
    } catch (error) {
      return handleApiFailure(error);
    }
  }
};
