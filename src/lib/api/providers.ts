// Provider Profile API Functions
import { supabase, handleApiSuccess, handleApiFailure, ApiResponse } from './index';
import type { ProviderProfile } from '@/types';

export const providersApi = {
  // Get all providers with filters
  async getProviders(filters?: {
    category_id?: string;
    city?: string;
    min_rating?: number;
    availability?: 'available' | 'busy' | 'unavailable';
    remote_service?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ProviderProfile[]>> {
    try {
      let query = supabase
        .from('provider_profiles')
        .select(`
          id, user_id, business_name, headline, avatar_url, banner_url, city, country, remote_service, skills, badges, rating_avg, rating_count, price_range, availability, slug, category_id, experience_years, languages, validation_status, is_featured, description, website, phone, social_links, created_at, updated_at, category:categories(id, name, slug), certifications, service_area, validation_note, validated_at, validated_by, profile_views, currency, review_count, availability_schedule
        `);

      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters?.min_rating) {
        query = query.gte('rating_avg', filters.min_rating);
      }

      if (filters?.availability) {
        query = query.eq('availability', filters.availability);
      }

      if (filters?.remote_service !== undefined) {
        query = query.eq('remote_service', filters.remote_service);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get provider by slug
  async getProviderBySlug(slug: string): Promise<ApiResponse<ProviderProfile>> {
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .select(`
          id, user_id, business_name, headline, avatar_url, banner_url, city, country, remote_service, skills, badges, rating_avg, rating_count, price_range, availability, slug, category_id, experience_years, languages, validation_status, is_featured, description, website, phone, social_links, created_at, updated_at, category:categories(id, name, slug), certifications, service_area, validation_note, validated_at, validated_by, profile_views, currency, review_count, availability_schedule
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get provider by user ID
  async getProviderByUserId(userId: string): Promise<ApiResponse<ProviderProfile>> {
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .select(`
          id, user_id, business_name, headline, avatar_url, banner_url, city, country, remote_service, skills, badges, rating_avg, rating_count, price_range, availability, slug, category_id, experience_years, languages, validation_status, is_featured, description, website, phone, social_links, created_at, updated_at, category:categories(id, name, slug), certifications, service_area, validation_note, validated_at, validated_by, profile_views, currency, review_count, availability_schedule
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Create provider profile
  async createProviderProfile(profile: Omit<ProviderProfile, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ProviderProfile>> {
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .insert({
          ...profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Update provider profile
  async updateProviderProfile(id: string, updates: Partial<ProviderProfile>): Promise<ApiResponse<ProviderProfile>> {
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Update provider availability
  async updateAvailability(id: string, availability: 'available' | 'busy' | 'unavailable'): Promise<ApiResponse<ProviderProfile>> {
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .update({ 
          availability,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Add badge to provider
  async addBadge(id: string, badge: string): Promise<ApiResponse<ProviderProfile>> {
    try {
      const { data: current } = await supabase
        .from('provider_profiles')
        .select('badges')
        .eq('id', id)
        .single();

      if (!current) throw new Error('Provider not found');

      const badges = [...(current.badges || []), badge];
      const uniqueBadges = [...new Set(badges)];

      const { data, error } = await supabase
        .from('provider_profiles')
        .update({ 
          badges: uniqueBadges,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Update provider rating
  async updateRating(id: string, rating: number, count: number): Promise<ApiResponse<ProviderProfile>> {
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .update({ 
          rating_avg: rating,
          rating_count: count,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Delete provider profile
  async deleteProviderProfile(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('provider_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return handleApiSuccess(null);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Search providers
  async searchProviders(query: string): Promise<ApiResponse<ProviderProfile[]>> {
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .select(`
          id, user_id, business_name, headline, avatar_url, banner_url, city, country, remote_service, skills, badges, rating_avg, rating_count, price_range, availability, slug, category_id, experience_years, languages, validation_status, is_featured, description, website, phone, social_links, created_at, updated_at, category:categories(id, name, slug), certifications, service_area, validation_note, validated_at, validated_by, profile_views, currency, review_count, availability_schedule
        `)
        .or(`business_name.ilike.%${query}%,headline.ilike.%${query}%,skills.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get featured providers
  async getFeaturedProviders(limit: number = 6): Promise<ApiResponse<ProviderProfile[]>> {
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .select(`
          id, user_id, business_name, headline, avatar_url, banner_url, city, country, remote_service, skills, badges, rating_avg, rating_count, price_range, availability, slug, category_id, experience_years, languages, validation_status, is_featured, description, website, phone, social_links, created_at, updated_at, category:categories(id, name, slug), certifications, service_area, validation_note, validated_at, validated_by, profile_views, currency, review_count, availability_schedule
        `)
        .gte('rating_avg', 4.5)
        .gte('rating_count', 5)
        .eq('availability', 'available')
        .limit(limit);

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  }
};
