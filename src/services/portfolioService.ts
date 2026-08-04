import { supabase } from '@/lib/supabase';

export interface PortfolioItem {
  id: string;
  provider_id: string;
  
  // Basic Information
  title: string;
  slug: string | null;
  description: string | null;
  short_description: string | null;
  
  // Media
  image_url: string;
  gallery_urls: string[];
  video_url: string | null;
  video_embed_url: string | null;
  
  // Categorization
  category: string | null;
  subcategory: string | null;
  tags: string[];
  technologies: string[];
  
  // Project Details
  project_date: string | null;
  project_duration: string | null;
  project_budget: string | null;
  client_name: string | null;
  client_logo_url: string | null;
  team_size: number | null;
  
  // Links
  project_url: string | null;
  github_url: string | null;
  behance_url: string | null;
  dribbble_url: string | null;
  figma_url: string | null;
  instagram_url: string | null;
  other_links: Record<string, string>;
  
  // Status & Visibility
  is_featured: boolean;
  is_published: boolean;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  
  // Metrics
  view_count: number;
  like_count: number;
  
  // Display Settings
  sort_order: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export async function getProviderProfileIdByUser(userId: string) {
  const { data, error } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching provider profile id:', error);
    return null;
  }

  return data?.id ?? null;
}

export async function getPortfolioItems(providerId: string) {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('provider_id', providerId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching portfolio items:', error);
    return [];
  }

  return (data || []) as PortfolioItem[];
}

export async function getPublishedPortfolioItems(providerId: string) {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching published portfolio items:', error);
    return [];
  }

  return (data || []) as PortfolioItem[];
}

export async function getPortfolioItemsForUser(userId: string) {
  // Use userId directly since portfolio_items.provider_id references auth.users(id)
  return getPortfolioItems(userId);
}

export async function createPortfolioItem(item: {
  provider_id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  short_description?: string | null;
  image_url: string;
  gallery_urls?: string[];
  video_url?: string | null;
  video_embed_url?: string | null;
  category?: string | null;
  subcategory?: string | null;
  tags?: string[];
  technologies?: string[];
  project_date?: string | null;
  project_duration?: string | null;
  project_budget?: string | null;
  client_name?: string | null;
  client_logo_url?: string | null;
  team_size?: number | null;
  project_url?: string | null;
  github_url?: string | null;
  behance_url?: string | null;
  dribbble_url?: string | null;
  figma_url?: string | null;
  instagram_url?: string | null;
  other_links?: Record<string, string>;
  is_featured?: boolean;
  is_published?: boolean;
  status?: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  sort_order?: number;
}) {
  const { data, error } = await supabase
    .from('portfolio_items')
    .insert({
      ...item,
      gallery_urls: item.gallery_urls ?? [],
      tags: item.tags ?? [],
      technologies: item.technologies ?? [],
      other_links: item.other_links ?? {},
      is_featured: item.is_featured ?? false,
      is_published: item.is_published ?? true,
      status: item.status ?? 'completed',
      sort_order: item.sort_order ?? 0,
      published_at: item.is_published !== false ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating portfolio item:', error);
    return null;
  }

  return data as PortfolioItem;
}

export async function updatePortfolioItem(
  itemId: string,
  updates: {
    title?: string;
    slug?: string | null;
    description?: string | null;
    short_description?: string | null;
    image_url?: string;
    gallery_urls?: string[];
    video_url?: string | null;
    video_embed_url?: string | null;
    category?: string | null;
    subcategory?: string | null;
    tags?: string[];
    technologies?: string[];
    project_date?: string | null;
    project_duration?: string | null;
    project_budget?: string | null;
    client_name?: string | null;
    client_logo_url?: string | null;
    team_size?: number | null;
    project_url?: string | null;
    github_url?: string | null;
    behance_url?: string | null;
    dribbble_url?: string | null;
    figma_url?: string | null;
    instagram_url?: string | null;
    other_links?: Record<string, string>;
    is_featured?: boolean;
    is_published?: boolean;
    status?: 'planning' | 'in_progress' | 'completed' | 'on_hold';
    sort_order?: number;
  }
) {
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Set published_at when publishing for the first time
  if (updates.is_published === true) {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('portfolio_items')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating portfolio item:', error);
    return null;
  }

  return data as PortfolioItem;
}

export async function deletePortfolioItem(itemId: string) {
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting portfolio item:', error);
    return false;
  }

  return true;
}

export async function reorderPortfolioItems(
  providerId: string,
  items: { id: string; sort_order: number }[]
) {
  const updates = items.map(item => 
    supabase
      .from('portfolio_items')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
  );

  const results = await Promise.all(updates);

  if (results.some(r => r.error)) {
    console.error('Error reordering portfolio items');
    return false;
  }

  return true;
}

export async function incrementViewCount(itemId: string) {
  const { error } = await supabase.rpc('increment_portfolio_view_count', { item_id: itemId });
  
  if (error) {
    console.error('Error incrementing view count:', error);
    return false;
  }
  
  return true;
}
