import { supabase } from '@/lib/supabase';

const PROFILE_BUCKET_NAME = 'profile-images';
const PORTFOLIO_BUCKET_NAME = 'portfolio-demo-videos';

const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];

export async function uploadImage(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; error: string | null }> {
  try {
    if (!allowedImageTypes.includes(file.type)) {
      return { url: '', error: 'Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.' };
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { url: '', error: 'L\'image ne doit pas dépasser 5MB.' };
    }

    const { data, error } = await supabase.storage
      .from(PROFILE_BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: '', error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from(PROFILE_BUCKET_NAME)
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: '', error: 'Erreur lors du téléchargement de l\'image.' };
  }
}

export async function uploadPortfolioMedia(
  file: File,
  path: string,
  kind: 'image' | 'video'
): Promise<{ url: string; error: string | null }> {
  try {
    if (kind === 'image') {
      if (!allowedImageTypes.includes(file.type)) {
        return { url: '', error: 'Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.' };
      }
    } else {
      if (!allowedVideoTypes.includes(file.type)) {
        return { url: '', error: 'Type de fichier non supporté. Utilisez MP4, WebM, MOV ou MKV.' };
      }

      const duration = await getVideoDuration(file);
      if (!duration) {
        return { url: '', error: 'Impossible de lire la durée de la vidéo.' };
      }

      if (duration > 10) {
        return { url: '', error: 'La vidéo doit durer 10 secondes maximum.' };
      }
    }

    const maxSize = kind === 'image' ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        url: '',
        error: kind === 'image'
          ? 'L\'image ne doit pas dépasser 5MB.'
          : 'La vidéo ne doit pas dépasser 20MB.',
      };
    }

    const { data, error } = await supabase.storage
      .from(PORTFOLIO_BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Portfolio media upload error:', error);
      return { url: '', error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from(PORTFOLIO_BUCKET_NAME)
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Portfolio media upload error:', error);
    return { url: '', error: 'Erreur lors du téléchargement du média.' };
  }
}

async function getVideoDuration(file: File): Promise<number | null> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const duration = await new Promise<number | null>((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = objectUrl;
      video.onloadedmetadata = () => {
        resolve(Number.isFinite(video.duration) ? video.duration : null);
      };
      video.onerror = () => resolve(null);
    });

    return duration;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function deleteImage(path: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from(PROFILE_BUCKET_NAME)
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

export async function deletePortfolioMedia(path: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from(PORTFOLIO_BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Delete media error:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Delete media error:', error);
    return { error: 'Erreur lors de la suppression du média.' };
  }
}

export function generateImagePath(userId: string, type: 'avatar' | 'banner'): string {
  const timestamp = Date.now();
  const extension = type === 'avatar' ? 'jpg' : 'jpg';
  return `${userId}/${type}-${timestamp}.${extension}`;
}

export function generatePortfolioMediaPath(providerId: string, kind: 'image' | 'video', originalName: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || (kind === 'video' ? 'mp4' : 'jpg');
  return `${providerId}/portfolio/${kind}-${timestamp}.${extension}`;
}
