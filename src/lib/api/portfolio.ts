// Portfolio API Functions
import { supabase, handleApiSuccess, handleApiFailure, ApiResponse } from './index';
import type { PortfolioItem } from '@/types';

export const portfolioApi = {
  // Get all portfolio items for a provider
  async getProviderPortfolio(providerId: string): Promise<ApiResponse<PortfolioItem[]>> {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', providerId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get portfolio item by ID
  async getPortfolioItem(itemId: string): Promise<ApiResponse<PortfolioItem>> {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Create portfolio item
  async createPortfolioItem(item: Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<PortfolioItem>> {
    try {
      let { data, error } = await supabase
        .from('portfolio_items')
        .insert({
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error && (error.message?.includes('schema cache') || error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST204')) {
        // Strip optional professional fields if not present in schema
        const { context, objective, role, process, result, ...baseItem } = item as any;
        const retry = await supabase
          .from('portfolio_items')
          .insert({
            ...baseItem,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Update portfolio item
  async updatePortfolioItem(itemId: string, updates: Partial<PortfolioItem>): Promise<ApiResponse<PortfolioItem>> {
    try {
      let { data, error } = await supabase
        .from('portfolio_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error && (error.message?.includes('schema cache') || error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST204')) {
        const { context, objective, role, process, result, ...baseUpdates } = updates as any;
        const retry = await supabase
          .from('portfolio_items')
          .update({
            ...baseUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Delete portfolio item
  async deletePortfolioItem(itemId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return handleApiSuccess(null);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Update portfolio item sort order
  async updateSortOrder(itemId: string, sortOrder: number): Promise<ApiResponse<PortfolioItem>> {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .update({ 
          sort_order: sortOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Add photo to portfolio item
  async addPhoto(itemId: string, photoUrl: string): Promise<ApiResponse<PortfolioItem>> {
    try {
      const { data: current } = await supabase
        .from('portfolio_items')
        .select('photos')
        .eq('id', itemId)
        .single();

      if (!current) throw new Error('Portfolio item not found');

      const photos = [...(current.photos || []), photoUrl];
      const uniquePhotos = [...new Set(photos)];

      const { data, error } = await supabase
        .from('portfolio_items')
        .update({ 
          photos: uniquePhotos,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Remove photo from portfolio item
  async removePhoto(itemId: string, photoUrl: string): Promise<ApiResponse<PortfolioItem>> {
    try {
      const { data: current } = await supabase
        .from('portfolio_items')
        .select('photos')
        .eq('id', itemId)
        .single();

      if (!current) throw new Error('Portfolio item not found');

      const photos = (current.photos || []).filter((p: string) => p !== photoUrl);

      const { data, error } = await supabase
        .from('portfolio_items')
        .update({ 
          photos,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Search portfolio items
  async searchPortfolioItems(query: string, providerId?: string): Promise<ApiResponse<PortfolioItem[]>> {
    try {
      let dbQuery = supabase
        .from('portfolio_items')
        .select('*');

      if (providerId) {
        dbQuery = dbQuery.eq('provider_id', providerId);
      }

      dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      const { data, error } = await dbQuery.limit(20);

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get portfolio items by category
  async getPortfolioByCategory(categoryId: string): Promise<ApiResponse<PortfolioItem[]>> {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  }
};
