import { useState, useEffect } from 'react';
import { 
  getProviderCategoryData, 
  updateProviderCategoryData,
  getCategoryFormTemplate,
  searchProvidersByCategoryData,
  getCategoryDataStats 
} from '@/lib/api/category-data';

/**
 * Hook pour gérer les données spécifiques aux catégories de prestataires
 */
export function useCategoryData(providerId: string) {
  const [categoryData, setCategoryData] = useState<Record<string, any> | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategoryData();
  }, [providerId]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getProviderCategoryData(providerId);
      
      if (response.success && response.data) {
        setCategoryData(response.data.category_data);
        setCategorySlug(response.data.category_slug);
      } else {
        setError(response.error || 'Failed to load category data');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateData = async (newData: Record<string, any>) => {
    if (!categorySlug) {
      setError('Category slug is required');
      return { success: false, error: 'Category slug is required' };
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await updateProviderCategoryData({
        provider_id: providerId,
        category_slug: categorySlug,
        category_data: newData
      });
      
      if (response.success) {
        setCategoryData(response.data || null);
        return { success: true };
      } else {
        setError(response.error || 'Failed to update category data');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    categoryData,
    categorySlug,
    loading,
    error,
    updateData,
    refreshData: loadCategoryData
  };
}

/**
 * Hook pour obtenir le template de formulaire d'une catégorie
 */
export function useCategoryFormTemplate(categorySlug: string) {
  const [template, setTemplate] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplate();
  }, [categorySlug]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCategoryFormTemplate(categorySlug);
      
      if (response.success && response.data) {
        setTemplate(response.data.template);
        setFields(response.data.fields);
      } else {
        setError(response.error || 'Failed to load category template');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    template,
    fields,
    loading,
    error,
    refreshTemplate: loadTemplate
  };
}

/**
 * Hook pour rechercher des prestataires par données de catégorie
 */
export function useCategorySearch(categorySlug: string, filters: Record<string, any> = {}) {
  const [results, setResults] = useState<any[]>([]);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (searchFilters?: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await searchProvidersByCategoryData(
        categorySlug,
        searchFilters || filters
      );
      
      if (response.success && response.data) {
        setResults(response.data.providers);
        setTemplate(response.data.template);
      } else {
        setError(response.error || 'Search failed');
        setResults([]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categorySlug) {
      search();
    }
  }, [categorySlug]);

  return {
    results,
    template,
    loading,
    error,
    search
  };
}

/**
 * Hook pour obtenir des statistiques sur les données de catégorie
 */
export function useCategoryStats(categorySlug: string) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [categorySlug]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCategoryDataStats(categorySlug);
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Failed to load category stats');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    error,
    refreshStats: loadStats
  };
}