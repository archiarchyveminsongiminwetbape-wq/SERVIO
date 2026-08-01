// Categories API Functions
import { supabase, handleApiSuccess, handleApiFailure, ApiResponse } from './index';
import type { Category } from '@/types';

export const categoriesApi = {
  // Get all categories
  async getAllCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get category by ID
  async getCategoryById(categoryId: string): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get category by slug
  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get parent categories (top-level)
  async getParentCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get subcategories for a parent category
  async getSubcategories(parentId: string): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', parentId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Create category (admin only)
  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Update category (admin only)
  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Delete category (admin only)
  async deleteCategory(categoryId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      return handleApiSuccess(null);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Search categories
  async searchCategories(query: string): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  }
};
