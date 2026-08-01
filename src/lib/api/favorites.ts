// Favorites API Functions
import { supabase, handleApiSuccess, handleApiFailure, ApiResponse } from './index';
import type { Favorite } from '@/types';

export const favoritesApi = {
  // Get user's favorites
  async getUserFavorites(userId: string): Promise<ApiResponse<Favorite[]>> {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          provider:provider_id(business_name, avatar_url, headline, rating_avg, city, price_range)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Check if provider is favorited by user
  async isProviderFavorited(userId: string, providerId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('provider_id', providerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return handleApiSuccess(!!data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Add to favorites
  async addFavorite(userId: string, providerId: string): Promise<ApiResponse<Favorite>> {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          provider_id: providerId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Remove from favorites
  async removeFavorite(userId: string, providerId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('provider_id', providerId);

      if (error) throw error;
      return handleApiSuccess(null);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Toggle favorite
  async toggleFavorite(userId: string, providerId: string): Promise<ApiResponse<{ favorited: boolean }>> {
    try {
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('provider_id', providerId)
        .single();

      if (existing) {
        await this.removeFavorite(userId, providerId);
        return handleApiSuccess({ favorited: false });
      } else {
        await this.addFavorite(userId, providerId);
        return handleApiSuccess({ favorited: true });
      }
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get favorite count for provider
  async getProviderFavoriteCount(providerId: string): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id', { count: 'exact' })
        .eq('provider_id', providerId);

      if (error) throw error;
      return handleApiSuccess(data?.length || 0);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get all favorites for a provider (for provider dashboard)
  async getProviderFavorites(providerId: string): Promise<ApiResponse<Favorite[]>> {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          user:user_id(full_name, avatar_url)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  }
};
