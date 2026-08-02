import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'profile-images';

export async function uploadImage(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; error: string | null }> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return { url: '', error: 'Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.' };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { url: '', error: 'L\'image ne doit pas dépasser 5MB.' };
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: '', error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: '', error: 'Erreur lors du téléchargement de l\'image.' };
  }
}

export async function deleteImage(path: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Delete error:', error);
    return { error: 'Erreur lors de la suppression de l\'image.' };
  }
}

export function generateImagePath(userId: string, type: 'avatar' | 'banner'): string {
  const timestamp = Date.now();
  const extension = type === 'avatar' ? 'jpg' : 'jpg';
  return `${userId}/${type}-${timestamp}.${extension}`;
}
