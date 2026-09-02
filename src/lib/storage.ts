import { supabase } from '@/lib/supabase';

const AVATAR_BUCKETS = ['avatars', 'profiles', 'portfolio-media', 'media'];
const BANNER_BUCKETS = ['banners', 'profiles', 'portfolio-media', 'media'];
const MEDIA_BUCKETS = ['portfolio-media', 'media', 'portfolio-photos', 'public'];
const CONTRACT_BUCKETS = ['contracts', 'documents', 'media', 'public'];

/**
 * Compresses an image file on the client side before upload
 */
export async function compressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<File | Blob> {
  // If not an image or SVG/GIF, return as is
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file with automatic bucket fallback
 */
export async function uploadImageToStorage({
  file,
  folder,
  userId,
  preferredBuckets,
}: {
  file: File;
  folder: 'avatars' | 'banners' | 'portfolio' | 'photos';
  userId: string;
  preferredBuckets: string[];
}): Promise<string> {
  if (!file) throw new Error('Aucun fichier fourni');
  if (!userId) throw new Error('Utilisateur non connecté');

  console.log(`[Storage] Starting upload for ${folder}, user: ${userId}, file: ${file.name}, size: ${file.size}`);

  const maxDimension = folder === 'avatars' ? 600 : folder === 'banners' ? 1800 : 1600;
  const compressed = await compressImage(file, maxDimension, maxDimension);
  
  const ext = file.name.split('.').pop() || 'jpg';
  const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${cleanExt || 'jpg'}`;
  const filePath = `${userId}/${folder}/${fileName}`;

  console.log(`[Storage] Compressed file size: ${compressed.size}, path: ${filePath}`);

  let lastError: any = null;

  for (const bucket of preferredBuckets) {
    try {
      console.log(`[Storage] Trying bucket: ${bucket}`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressed, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error(`[Storage] Upload failed for bucket ${bucket}:`, error);
        lastError = error;
        continue;
      }

      if (data) {
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (publicData?.publicUrl) {
          console.log(`[Storage] Upload successful! URL: ${publicData.publicUrl}`);
          return publicData.publicUrl;
        }
      }
    } catch (err) {
      console.error(`[Storage] Exception for bucket ${bucket}:`, err);
      lastError = err;
      continue;
    }
  }

  const errorMessage = lastError?.message || 'Erreur inconnue de stockage';
  console.error(`[Storage] All buckets failed. Last error:`, lastError);
  
  if (errorMessage.includes('Bucket not found') || lastError?.statusCode === '404') {
    throw new Error('Les buckets de stockage Supabase ne sont pas configurés. Veuillez contacter l\'administrateur pour configurer les buckets "avatars", "banners", et "portfolio-media" dans Supabase Storage.');
  }
  if (errorMessage.includes('row-level security') || lastError?.statusCode === '403') {
    throw new Error('Permission de stockage refusée (RLS). Vérifiez que vous êtes connecté et que les politiques RLS sont configurées correctement.');
  }
  if (errorMessage.includes('JWT') || errorMessage.includes('auth')) {
    throw new Error('Erreur d\'authentification. Veuillez vous reconnecter et réessayer.');
  }

  throw new Error(`Erreur lors de l'upload: ${errorMessage}`);
}

/**
 * Upload an avatar image for a user / provider
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  return uploadImageToStorage({
    file,
    folder: 'avatars',
    userId,
    preferredBuckets: AVATAR_BUCKETS,
  });
}

/**
 * Upload a banner / cover image for a user / provider
 */
export async function uploadBanner(file: File, userId: string): Promise<string> {
  return uploadImageToStorage({
    file,
    folder: 'banners',
    userId,
    preferredBuckets: BANNER_BUCKETS,
  });
}

/**
 * Upload a portfolio photo
 */
export async function uploadPortfolioPhoto(file: File, userId: string): Promise<string> {
  return uploadImageToStorage({
    file,
    folder: 'photos',
    userId,
    preferredBuckets: MEDIA_BUCKETS,
  });
}

export async function uploadContractPdf(file: Blob | File, bookingId: string, providerId: string): Promise<string> {
  if (!file) throw new Error('Aucun PDF de contrat fourni');
  if (!bookingId) throw new Error('Identifiant du booking requis');
  if (!providerId) throw new Error('Identifiant du prestataire requis');

  const fileBlob = file instanceof Blob ? file : new Blob([file], { type: 'application/pdf' });
  const fileName = `${bookingId}-${Date.now()}.pdf`;
  const filePath = `${providerId}/contracts/${fileName}`;

  let lastError: any = null;

  for (const bucket of CONTRACT_BUCKETS) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf',
        });

      if (error) {
        lastError = error;
        continue;
      }

      if (data) {
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  const errorMessage = lastError?.message || 'Erreur inconnue d’upload du contrat';
  throw new Error(`Erreur lors de l'enregistrement du contrat PDF: ${errorMessage}`);
}
