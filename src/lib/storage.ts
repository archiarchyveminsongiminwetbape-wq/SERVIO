import { supabase } from './supabase';

export function getPublicUrl(bucket: string, path: string): string {
  if (!path) return '';
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

export function getProfileImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  return getPublicUrl('profile-images', path);
}

export function getPortfolioImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  return getPublicUrl('portfolio-media', path);
}

export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<{ path: string; url: string } | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('profile-images')
    .upload(fileName, file, {
      upsert: true
    });
  
  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }
  
  const url = getProfileImageUrl(data.path);
  return { path: data.path, url };
}

export async function deleteProfileImage(path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from('profile-images')
    .remove([path]);
  
  if (error) {
    console.error('Error deleting image:', error);
    return false;
  }
  
  return true;
}
