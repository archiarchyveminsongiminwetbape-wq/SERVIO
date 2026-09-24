import { supabase } from '../supabase';
import { getCategoryTemplate, getCategoryFields } from '@/data/category-templates';

/**
 * API pour gérer les données spécifiques aux catégories de prestataires
 */

export interface CategoryDataResponse {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

export interface CategoryDataUpdate {
  provider_id: string;
  category_slug: string;
  category_data: Record<string, any>;
}

/**
 * Récupérer les données spécifiques à la catégorie d'un prestataire
 */
export async function getProviderCategoryData(providerId: string): Promise<CategoryDataResponse> {
  try {
    const { data, error } = await supabase
      .from('provider_profiles')
      .select('category_id, category_specific_data, categories(slug)')
      .eq('id', providerId)
      .single();

    if (error) throw error;

    if (!data) {
      return {
        success: false,
        error: 'Provider profile not found'
      };
    }

    const categorySlug = Array.isArray(data.categories) ? (data.categories as any)[0]?.slug : (data.categories as any)?.slug;
    const categoryData = data.category_specific_data || {};

    return {
      success: true,
      data: {
        category_slug: categorySlug,
        category_data: categoryData
      }
    };
  } catch (error: any) {
    console.error('Error fetching category data:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch category data'
    };
  }
}

/**
 * Mettre à jour les données spécifiques à la catégorie d'un prestataire
 */
export async function updateProviderCategoryData(updateData: CategoryDataUpdate): Promise<CategoryDataResponse> {
  try {
    // Valider les données selon le template de la catégorie
    const template = getCategoryTemplate(updateData.category_slug);
    if (!template) {
      return {
        success: false,
        error: 'Category template not found'
      };
    }

    // Valider les champs requis
    const errors: string[] = [];
    template.fields.forEach(field => {
      if (field.required && !updateData.category_data[field.id]) {
        errors.push(`${field.label} est requis`);
      }
      
      if (field.validation && updateData.category_data[field.id] !== undefined) {
        const validationResult = field.validation(updateData.category_data[field.id]);
        if (typeof validationResult === 'string') {
          errors.push(validationResult);
        }
      }
    });

    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join(', ')
      };
    }

    // Mettre à jour les données dans Supabase
    const { data, error } = await supabase
      .from('provider_profiles')
      .update({
        category_specific_data: updateData.category_data,
        updated_at: new Date().toISOString()
      })
      .eq('id', updateData.provider_id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data.category_specific_data
    };
  } catch (error: any) {
    console.error('Error updating category data:', error);
    return {
      success: false,
      error: error.message || 'Failed to update category data'
    };
  }
}

/**
 * Récupérer le template de formulaire pour une catégorie
 */
export async function getCategoryFormTemplate(categorySlug: string) {
  try {
    const fields = getCategoryFields(categorySlug);
    const template = getCategoryTemplate(categorySlug);

    if (!template) {
      return {
        success: false,
        error: 'Category template not found'
      };
    }

    return {
      success: true,
      data: {
        template,
        fields
      }
    };
  } catch (error: any) {
    console.error('Error fetching category template:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch category template'
    };
  }
}

/**
 * Rechercher des prestataires par données spécifiques à leur catégorie
 */
export async function searchProvidersByCategoryData(
  categorySlug: string,
  searchFilters: Record<string, any>
): Promise<CategoryDataResponse> {
  try {
    const template = getCategoryTemplate(categorySlug);
    if (!template) {
      return {
        success: false,
        error: 'Category template not found'
      };
    }

    // D'abord récupérer l'ID de la catégorie
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (categoryError || !categoryData) {
      return {
        success: false,
        error: 'Category not found'
      };
    }

    // Construire la requête de recherche
    let query = supabase
      .from('provider_profiles')
      .select(`
        id, business_name, slug, headline, avatar_url, city, 
        rating_avg, rating_count, category_specific_data,
        categories(slug, name)
      `)
      .eq('category_id', categoryData.id);

    // Appliquer les filtres sur les données spécifiques
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (value && Array.isArray(value)) {
        // Pour les champs multiselect, vérifier si la valeur est dans le tableau
        query = query.contains('category_specific_data', {
          [key]: value
        });
      } else if (value) {
        // Pour les champs simples, vérifier l'égalité
        query = query.filter('category_specific_data', `->>${key}`, `eq.${value}`);
      }
    });

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: {
        providers: data,
        template
      }
    };
  } catch (error: any) {
    console.error('Error searching providers by category data:', error);
    return {
      success: false,
      error: error.message || 'Failed to search providers'
    };
  }
}

/**
 * Obtenir des statistiques sur les données de catégorie
 */
export async function getCategoryDataStats(categorySlug: string) {
  try {
    const template = getCategoryTemplate(categorySlug);
    if (!template) {
      return {
        success: false,
        error: 'Category template not found'
      };
    }

    // D'abord récupérer l'ID de la catégorie
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (categoryError || !categoryData) {
      return {
        success: false,
        error: 'Category not found'
      };
    }

    // Récupérer tous les prestataires de cette catégorie
    const { data: providers, error } = await supabase
      .from('provider_profiles')
      .select('category_specific_data')
      .eq('category_id', categoryData.id);

    if (error) throw error;

    // Calculer les statistiques pour chaque champ
    const stats: Record<string, any> = {};
    
    template.fields.forEach(field => {
      const fieldValues = providers
        .map(p => p.category_specific_data?.[field.id])
        .filter(Boolean);

      if (field.type === 'multiselect') {
        // Pour les multiselect, compter les occurrences de chaque option
        const optionCounts: Record<string, number> = {};
        fieldValues.forEach(values => {
          if (Array.isArray(values)) {
            values.forEach(value => {
              optionCounts[value] = (optionCounts[value] || 0) + 1;
            });
          }
        });
        stats[field.id] = {
          type: 'distribution',
          data: optionCounts,
          total: fieldValues.length
        };
      } else if (field.type === 'select') {
        // Pour les select, compter les occurrences de chaque option
        const optionCounts: Record<string, number> = {};
        fieldValues.forEach(value => {
          if (value) {
            optionCounts[value] = (optionCounts[value] || 0) + 1;
          }
        });
        stats[field.id] = {
          type: 'distribution',
          data: optionCounts,
          total: fieldValues.length
        };
      } else if (field.type === 'number') {
        // Pour les nombres, calculer la moyenne, min, max
        const numbers = fieldValues.filter(v => typeof v === 'number');
        if (numbers.length > 0) {
          stats[field.id] = {
            type: 'numeric',
            average: numbers.reduce((a, b) => a + b, 0) / numbers.length,
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            total: numbers.length
          };
        }
      } else {
        // Pour les autres types, juste compter le nombre de valeurs
        stats[field.id] = {
          type: 'count',
          total: fieldValues.length
        };
      }
    });

    return {
      success: true,
      data: {
        category: categorySlug,
        total_providers: providers.length,
        field_stats: stats
      }
    };
  } catch (error: any) {
    console.error('Error getting category data stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to get category data stats'
    };
  }
}