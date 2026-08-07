// Reviews API Functions
import { supabase, handleApiSuccess, handleApiFailure, ApiResponse } from './index';
import type { Review } from '@/types';

export const reviewsApi = {
  // Get reviews for a provider
  async getProviderReviews(providerId: string): Promise<ApiResponse<Review[]>> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_id(full_name, avatar_url)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get review by ID
  async getReview(reviewId: string): Promise<ApiResponse<Review>> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Create review
  async createReview(review: Omit<Review, 'id' | 'created_at'>): Promise<ApiResponse<Review>> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          ...review,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update provider rating
      await this.updateProviderRating(review.provider_id);

      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Update review
  async updateReview(reviewId: string, updates: Partial<Review>): Promise<ApiResponse<Review>> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;

      // Update provider rating if rating changed
      if (updates.rating !== undefined) {
        const review = await this.getReview(reviewId);
        if (review.data) {
          await this.updateProviderRating(review.data.provider_id);
        }
      }

      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Delete review
  async deleteReview(reviewId: string): Promise<ApiResponse<void>> {
    try {
      const review = await this.getReview(reviewId);
      const providerId = review.data?.provider_id;

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      // Update provider rating
      if (providerId) {
        await this.updateProviderRating(providerId);
      }

      return handleApiSuccess(null);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get user's reviews
  async getUserReviews(userId: string): Promise<ApiResponse<Review[]>> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Check if user has reviewed provider
  async hasUserReviewedProvider(userId: string, providerId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('reviewer_id', userId)
        .eq('provider_id', providerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return handleApiSuccess(!!data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get average rating for provider
  async getProviderAverageRating(providerId: string): Promise<ApiResponse<{ rating: number; count: number }>> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', providerId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return handleApiSuccess({ rating: 0, count: 0 });
      }

      const sum = data.reduce((acc, r) => acc + (r.rating || 0), 0);
      const avg = sum / data.length;

      return handleApiSuccess({ rating: Math.round(avg * 10) / 10, count: data.length });
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Update provider rating (internal function)
  async updateProviderRating(providerId: string): Promise<void> {
    try {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', providerId);

      if (!reviews || reviews.length === 0) {
        await supabase
          .from('provider_profiles')
          .update({ rating_avg: 0, rating_count: 0 })
          .eq('id', providerId);
        return;
      }

      const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      const avg = sum / reviews.length;

      await supabase
        .from('provider_profiles')
        .update({ 
          rating_avg: Math.round(avg * 10) / 10,
          rating_count: reviews.length
        })
        .eq('id', providerId);
    } catch (error) {
      console.error('Error updating provider rating:', error);
    }
  },

  // Get recent reviews
  async getRecentReviews(limit: number = 10): Promise<ApiResponse<Review[]>> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_id(full_name, avatar_url),
          provider:provider_id(business_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  }
};
