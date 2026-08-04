import { supabase } from '@/lib/supabase';

export interface PortfolioItem {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  photos: string[];
  video_url: string | null;
  category_id: string | null;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
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

export async function getPortfolioItemsForUser(userId: string) {
  const providerId = await getProviderProfileIdByUser(userId);
  if (!providerId) return [];
  return getPortfolioItems(providerId);
}

export async function createPortfolioItem(item: {
  provider_id: string;
  title: string;
  description?: string | null;
  photos?: string[];
  video_url?: string | null;
  category_id?: string | null;
  tags?: string[];
  sort_order?: number;
}) {
  const { data, error } = await supabase
    .from('portfolio_items')
    .insert({
      ...item,
      photos: item.photos ?? [],
      tags: item.tags ?? [],
      video_url: item.video_url ?? null,
      category_id: item.category_id ?? null,
      sort_order: item.sort_order ?? 0,
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
    description?: string | null;
    photos?: string[];
    video_url?: string | null;
    category_id?: string | null;
    tags?: string[];
    sort_order?: number;
  }
) {
  const { data, error } = await supabase
    .from('portfolio_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
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
