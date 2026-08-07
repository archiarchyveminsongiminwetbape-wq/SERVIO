import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadImage, deleteImage, generateImagePath } from '@/services/imageUploadService';

interface ImageUploadProps {
  currentUrl?: string | null;
  userId: string;
  type: 'avatar' | 'banner';
  aspectRatio?: 'square' | 'wide';
  onUrlChange: (url: string | null) => void;
  label?: string;
}

export default function ImageUpload({
  currentUrl,
  userId,
  type,
  aspectRatio = 'square',
  onUrlChange,
  label,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const path = generateImagePath(userId, type);
    const { url, error: uploadError } = await uploadImage(file, path);

    if (uploadError) {
      setError(uploadError);
      setUploading(false);
      return;
    }

    onUrlChange(url);
    setUploading(false);
  };

  const handleRemove = async () => {
    if (currentUrl) {
      // Extract path from URL
      const urlParts = currentUrl.split('/');
      const path = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1];
      await deleteImage(path);
    }
    onUrlChange(null);
  };

  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : 'aspect-video';

  return (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}
      
      <div className={`relative ${aspectClass} w-full max-w-sm overflow-hidden rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50`}>
        {currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt={type === 'avatar' ? 'Avatar' : 'Bannière'}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-900 hover:bg-neutral-100"
                  title="Changer l'image"
                >
                  <Upload size={18} />
                </button>
                <button
                  onClick={handleRemove}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-error-600 hover:bg-error-50"
                  title="Supprimer l'image"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            {uploading ? (
              <Loader2 size={32} className="animate-spin text-primary-500" />
            ) : (
              <>
                <Upload size={32} className="text-neutral-400" />
                <p className="mt-2 text-sm text-neutral-600">Cliquez pour uploader</p>
                <p className="text-xs text-neutral-400">JPG, PNG, WebP (max 5MB)</p>
              </>
            )}
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={uploading}
        />
      </div>

      {error && (
        <p className="text-sm text-error-600">{error}</p>
      )}
    </div>
  );
}
