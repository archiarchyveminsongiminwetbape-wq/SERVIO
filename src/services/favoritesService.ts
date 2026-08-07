import { supabase } from '@/lib/supabase';

export interface Favorite {
  id: string;
  user_id: string;
  provider_id: string;
  created_at: string;
}

export async function getFavorites(userId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      *,
      provider:provider_profiles (*, category:categories (*))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  return data as any[];
}

export async function isFavorite(userId: string, providerId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .eq('provider_id', providerId)
    .maybeSingle();

  if (error) {
    console.error('Error checking favorite:', error);
    return false;
  }

  return !!data;
}

export async function addFavorite(userId: string, providerId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      provider_id: providerId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding favorite:', error);
    return null;
  }

  return data as Favorite;
}

export async function removeFavorite(userId: string, providerId: string) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('provider_id', providerId);

  if (error) {
    console.error('Error removing favorite:', error);
    return false;
  }

  return true;
}

export async function toggleFavorite(userId: string, providerId: string) {
  const isFav = await isFavorite(userId, providerId);
  
  if (isFav) {
    return await removeFavorite(userId, providerId);
  } else {
    return await addFavorite(userId, providerId);
  }
}

export function subscribeToFavorites(
  userId: string,
  callback: (favorite: Favorite) => void
) {
  const channel = supabase
    .channel('favorites')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'favorites',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Favorite);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
