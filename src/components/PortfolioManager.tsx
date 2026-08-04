import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit3, Loader2, Image as ImageIcon, Video, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getPortfolioItemsForUser,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  getProviderProfileIdByUser,
  type PortfolioItem,
} from '@/services/portfolioService';
import { uploadPortfolioMedia, generatePortfolioMediaPath } from '@/services/imageUploadService';

export default function PortfolioManager() {
  const { user } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [providerProfileId, setProviderProfileId] = useState<string | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newTag, setNewTag] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    photos: [] as string[],
    video_url: '',
    tags: [] as string[],
  });

  useEffect(() => {
    if (user) {
      loadPortfolio();
    }
  }, [user]);

  async function loadPortfolio() {
    if (!user) return;
    setLoading(true);

    const providerId = await getProviderProfileIdByUser(user.id);
    setProviderProfileId(providerId);

    if (providerId) {
      const data = await getPortfolioItemsForUser(user.id);
      setItems(data);
    } else {
      setItems([]);
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !providerProfileId) return;

    if (formData.video_url.trim()) {
      const valid = await validateExternalVideoUrl(formData.video_url.trim());
      if (!valid) {
        setUploadError('La vidéo externe doit être lisible et durer maximum 10 secondes.');
        return;
      }
    }

    const payload = {
      title: formData.title,
      description: formData.description || null,
      photos: formData.photos,
      video_url: formData.video_url || null,
      tags: formData.tags,
      sort_order: items.length,
    };

    if (editingItem) {
      await updatePortfolioItem(editingItem.id, payload);
    } else {
      await createPortfolioItem({
        provider_id: providerProfileId,
        ...payload,
      });
    }

    setShowForm(false);
    setEditingItem(null);
    resetForm();
    await loadPortfolio();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce projet ?')) return;
    await deletePortfolioItem(id);
    await loadPortfolio();
  }

  function handleEdit(item: PortfolioItem) {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      photos: item.photos || [],
      video_url: item.video_url || '',
      tags: item.tags || [],
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({ title: '', description: '', photos: [], video_url: '', tags: [] });
    setNewPhotoUrl('');
    setNewTag('');
  }

  function handleCancel() {
    setShowForm(false);
    setEditingItem(null);
    resetForm();
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadError(null);
    setUploadingPhoto(true);

    const path = generatePortfolioMediaPath(providerProfileId ?? user.id, 'image', file.name);
    const { url, error } = await uploadPortfolioMedia(file, path, 'image');

    if (error || !url) {
      setUploadError(error ?? 'Erreur lors du téléchargement de la photo.');
      setUploadingPhoto(false);
      return;
    }

    if (!formData.photos.includes(url)) {
      setFormData({ ...formData, photos: [...formData.photos, url] });
    }

    setUploadingPhoto(false);
    e.target.value = '';
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('video/')) {
      setUploadError('Le fichier sélectionné n\'est pas une vidéo valide.');
      return;
    }

    setUploadError(null);
    setUploadingVideo(true);

    const path = generatePortfolioMediaPath(providerProfileId ?? user.id, 'video', file.name);
    const { url, error } = await uploadPortfolioMedia(file, path, 'video');

    if (error || !url) {
      setUploadError(error ?? 'Erreur lors du téléchargement de la vidéo.');
      setUploadingVideo(false);
      return;
    }

    setFormData({ ...formData, video_url: url });
    setUploadingVideo(false);
    e.target.value = '';
  }

  async function validateExternalVideoUrl(url: string) {
    if (!url.trim()) return true;

    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          if (Number.isFinite(video.duration) && video.duration > 10) {
            reject(new Error('La vidéo dépasse 10 secondes.'));
            return;
          }
          resolve();
        };
        video.onerror = () => reject(new Error('La vidéo externe est introuvable ou illisible.'));
      });
      return true;
    } catch {
      return false;
    }
  }

  function addPhotoUrl() {
    const url = newPhotoUrl.trim();
    if (!url) return;
    if (!formData.photos.includes(url)) {
      setFormData({ ...formData, photos: [...formData.photos, url] });
    }
    setNewPhotoUrl('');
  }

  function removePhotoUrl(url: string) {
    setFormData({ ...formData, photos: formData.photos.filter((photo) => photo !== url) });
  }

  function addTag() {
    const tag = newTag.trim();
    if (!tag) return;
    if (!formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
    setNewTag('');
  }

  function removeTag(tag: string) {
    setFormData({ ...formData, tags: formData.tags.filter((item) => item !== tag) });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">Portfolio ({items.length})</h3>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} />
          Ajouter un projet
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h4 className="mb-4 font-semibold text-neutral-900">
            {editingItem ? 'Modifier' : 'Nouveau'} projet
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Titre</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[100px]"
                rows={3}
              />
            </div>

            <div>
              <label className="label">Photos du projet</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="input-field flex-1"
                  placeholder="https://.../image.jpg"
                />
                <button type="button" onClick={addPhotoUrl} className="btn-secondary">
                  <Plus size={18} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="btn-secondary"
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  Uploader une photo
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              {formData.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.photos.map((photo) => (
                    <div key={photo} className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">
                      <span className="max-w-[180px] truncate">{photo}</span>
                      <button type="button" onClick={() => removePhotoUrl(photo)} className="text-neutral-500 hover:text-error-600">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label">Démo vidéo courte (upload max 10s)</label>
              <p className="mb-2 text-xs text-neutral-500">Récupère la vidéo courte de démonstration</p>
              <div className="flex items-center gap-2">
                <Video size={16} className="text-neutral-400" />
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="input-field flex-1"
                  placeholder="https://.../demo.mp4"
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="btn-secondary"
                  disabled={uploadingVideo}
                >
                  {uploadingVideo ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
                  Uploader une vidéo courte
                </button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                  className="hidden"
                  onChange={handleVideoUpload}
                />
                <span className="text-xs text-neutral-500">Durée maximale : 10 secondes</span>
              </div>
            </div>

            <div>
              <label className="label">Mots-clés</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="input-field flex-1"
                  placeholder="Ex: branding"
                />
                <button type="button" onClick={addTag} className="btn-secondary">
                  <Plus size={18} />
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-primary-900">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {uploadError && (
              <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{uploadError}</div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={handleCancel} className="btn-secondary">
                Annuler
              </button>
              <button type="submit" className="btn-primary">
                {editingItem ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <ImageIcon size={48} className="text-neutral-300" />
          <p className="mt-3 text-sm text-neutral-500">Aucun projet dans votre portfolio</p>
          <p className="text-xs text-neutral-400">Ajoutez vos meilleurs travaux pour mettre en valeur votre expertise</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="card overflow-hidden group">
              <div className="relative aspect-video overflow-hidden bg-neutral-100">
                {item.video_url ? (
                  <video
                    src={item.video_url}
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    poster={item.photos[0]}
                    className="h-full w-full object-cover"
                  />
                ) : item.photos[0] ? (
                  <img
                    src={item.photos[0]}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-100">
                    <ImageIcon size={32} className="text-neutral-300" />
                  </div>
                )}

                {(item.video_url || item.photos.length > 0) && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {item.video_url ? 'Démo vidéo' : 'Projet'}
                  </div>
                )}

                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => handleEdit(item)} className="rounded-lg bg-white/90 p-2 shadow-sm hover:bg-white">
                    <Edit3 size={16} className="text-neutral-600" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="rounded-lg bg-white/90 p-2 shadow-sm hover:bg-white">
                    <Trash2 size={16} className="text-error-600" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-semibold text-neutral-900">{item.title}</h4>
                {item.description && (
                  <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{item.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="badge bg-primary-50 text-primary-700">
                      {tag}
                    </span>
                  ))}
                  {item.photos.length > 1 && (
                    <span className="badge bg-neutral-100 text-neutral-600">
                      +{item.photos.length - 1} photo{item.photos.length > 2 ? 's' : ''}
                    </span>
                  )}
                      {item.video_url && (
                    <span className="badge bg-accent-50 text-accent-700">
                      <Video size={12} /> 10s max
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
