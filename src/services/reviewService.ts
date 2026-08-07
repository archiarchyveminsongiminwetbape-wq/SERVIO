import { supabase } from '@/lib/supabase';

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  provider_id: string;
  rating: number;
  title?: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export async function getReviews(providerId: string, limit = 10) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:profiles (id, full_name, avatar_url)
    `)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data as Review[];
}

export async function getReviewByBooking(bookingId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching review:', error);
    return null;
  }

  return data as Review;
}

export async function createReview(review: {
  booking_id: string;
  user_id: string;
  provider_id: string;
  rating: number;
  title?: string;
  content: string;
}) {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    return null;
  }

  return data as Review;
}

export async function updateReview(
  reviewId: string,
  updates: {
    rating?: number;
    title?: string;
    content?: string;
  }
) {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    console.error('Error updating review:', error);
    return null;
  }

  return data as Review;
}

export async function deleteReview(reviewId: string) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    console.error('Error deleting review:', error);
    return false;
  }

  return true;
}

export async function getUserReviews(userId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      provider:profiles (id, full_name, avatar_url),
      booking:bookings (id, date, time)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }

  return data as Review[];
}
