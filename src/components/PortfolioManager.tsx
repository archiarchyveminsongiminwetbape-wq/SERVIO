import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit3, Loader2, Image as ImageIcon, X, Video, Link as LinkIcon, Globe, Github, ExternalLink } from 'lucide-react';
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'media' | 'category' | 'details' | 'links' | 'status'>('basic');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    slug: '',
    description: '',
    short_description: '',
    
    // Media
    image_url: '',
    gallery_urls: [] as string[],
    video_url: '',
    video_embed_url: '',
    
    // Categorization
    category: '',
    subcategory: '',
    tags: [] as string[],
    technologies: [] as string[],
    newTag: '',
    newTechnology: '',
    
    // Project Details
    project_date: '',
    project_duration: '',
    project_budget: '',
    client_name: '',
    client_logo_url: '',
    team_size: '',
    
    // Links
    project_url: '',
    github_url: '',
    behance_url: '',
    dribbble_url: '',
    figma_url: '',
    instagram_url: '',
    
    // Status & Visibility
    is_featured: false,
    is_published: true,
    status: 'completed' as 'planning' | 'in_progress' | 'completed' | 'on_hold',
  });

  useEffect(() => {
    if (user) {
      loadPortfolio();
    }
  }, [user]);

  async function loadPortfolio() {
    if (!user) return;
    setLoading(true);

    // Use userId directly since portfolio_items.provider_id references auth.users(id)
    const data = await getPortfolioItemsForUser(user.id);
    setItems(data);
    setProviderProfileId(user.id);

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !providerProfileId) return;

    // Make image optional temporarily until storage RLS is fixed
    if (!formData.title.trim()) {
      setUploadError('Veuillez ajouter un titre pour ce projet.');
      return;
    }

    const payload = {
      title: formData.title,
      slug: formData.slug || null,
      description: formData.description || null,
      short_description: formData.short_description || null,
      image_url: formData.image_url,
      gallery_urls: formData.gallery_urls,
      video_url: formData.video_url || null,
      video_embed_url: formData.video_embed_url || null,
      category: formData.category || null,
      subcategory: formData.subcategory || null,
      tags: formData.tags,
      technologies: formData.technologies,
      project_date: formData.project_date || null,
      project_duration: formData.project_duration || null,
      project_budget: formData.project_budget || null,
      client_name: formData.client_name || null,
      client_logo_url: formData.client_logo_url || null,
      team_size: formData.team_size ? parseInt(formData.team_size) : null,
      project_url: formData.project_url || null,
      github_url: formData.github_url || null,
      behance_url: formData.behance_url || null,
      dribbble_url: formData.dribbble_url || null,
      figma_url: formData.figma_url || null,
      instagram_url: formData.instagram_url || null,
      is_featured: formData.is_featured,
      is_published: formData.is_published,
      status: formData.status,
      sort_order: items.length,
    };

    try {
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
      setUploadError(null);
      await loadPortfolio();
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      setUploadError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce projet ?')) return;
    await deletePortfolioItem(id);
    await loadPortfolio();
  }

  function handleEdit(item: PortfolioItem) {
    setEditingItem(item);
    setFormData({
      // Basic Information
      title: item.title,
      slug: item.slug || '',
      description: item.description || '',
      short_description: item.short_description || '',
      
      // Media
      image_url: item.image_url,
      gallery_urls: item.gallery_urls || [],
      video_url: item.video_url || '',
      video_embed_url: item.video_embed_url || '',
      
      // Categorization
      category: item.category || '',
      subcategory: item.subcategory || '',
      tags: item.tags || [],
      technologies: item.technologies || [],
      newTag: '',
      newTechnology: '',
      
      // Project Details
      project_date: item.project_date || '',
      project_duration: item.project_duration || '',
      project_budget: item.project_budget || '',
      client_name: item.client_name || '',
      client_logo_url: item.client_logo_url || '',
      team_size: item.team_size?.toString() || '',
      
      // Links
      project_url: item.project_url || '',
      github_url: item.github_url || '',
      behance_url: item.behance_url || '',
      dribbble_url: item.dribbble_url || '',
      figma_url: item.figma_url || '',
      instagram_url: item.instagram_url || '',
      
      // Status & Visibility
      is_featured: item.is_featured,
      is_published: item.is_published,
      status: item.status,
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      // Basic Information
      title: '',
      slug: '',
      description: '',
      short_description: '',
      
      // Media
      image_url: '',
      gallery_urls: [],
      video_url: '',
      video_embed_url: '',
      
      // Categorization
      category: '',
      subcategory: '',
      tags: [],
      technologies: [],
      newTag: '',
      newTechnology: '',
      
      // Project Details
      project_date: '',
      project_duration: '',
      project_budget: '',
      client_name: '',
      client_logo_url: '',
      team_size: '',
      
      // Links
      project_url: '',
      github_url: '',
      behance_url: '',
      dribbble_url: '',
      figma_url: '',
      instagram_url: '',
      
      // Status & Visibility
      is_featured: false,
      is_published: true,
      status: 'completed',
    });
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
    setUploading(true);

    const path = generatePortfolioMediaPath(providerProfileId ?? user.id, 'image', file.name);
    const { url, error } = await uploadPortfolioMedia(file, path, 'image');

    if (error || !url) {
      setUploadError(error ?? 'Erreur lors du téléchargement de la photo.');
      setUploading(false);
      return;
    }

    setFormData({ ...formData, image_url: url });
    setUploading(false);
    e.target.value = '';
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !user) return;

    setUploadError(null);
    setUploading(true);

    const uploadPromises = Array.from(files).map(async (file) => {
      const path = generatePortfolioMediaPath(providerProfileId ?? user.id, 'gallery', file.name);
      const { url, error } = await uploadPortfolioMedia(file, path, 'image');
      if (error || !url) {
        console.error('Error uploading gallery image:', error);
        return null;
      }
      return url;
    });

    const urls = await Promise.all(uploadPromises);
    const validUrls = urls.filter((url): url is string => url !== null);

    setFormData({ ...formData, gallery_urls: [...formData.gallery_urls, ...validUrls] });
    setUploading(false);
    e.target.value = '';
  }

  function addTag() {
    const tag = formData.newTag.trim();
    if (!tag || formData.tags.includes(tag)) return;
    setFormData({ ...formData, tags: [...formData.tags, tag], newTag: '' });
  }

  function removeTag(tag: string) {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  }

  function addTechnology() {
    const tech = formData.newTechnology.trim();
    if (!tech || formData.technologies.includes(tech)) return;
    setFormData({ ...formData, technologies: [...formData.technologies, tech], newTechnology: '' });
  }

  function removeTechnology(tech: string) {
    setFormData({ ...formData, technologies: formData.technologies.filter(t => t !== tech) });
  }

  function removeGalleryUrl(url: string) {
    setFormData({ ...formData, gallery_urls: formData.gallery_urls.filter(u => u !== url) });
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
          
          {/* Section Navigation */}
          <div className="mb-6 flex flex-wrap gap-2 border-b border-neutral-200 pb-2">
            {[
              { id: 'basic', label: 'Informations' },
              { id: 'media', label: 'Médias' },
              { id: 'category', label: 'Catégories' },
              { id: 'details', label: 'Détails' },
              { id: 'links', label: 'Liens' },
              { id: 'status', label: 'Statut' },
            ].map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id as any)}
                className={`whitespace-nowrap px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information Section */}
            {activeSection === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="label">Titre *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Slug (URL)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="input-field"
                    placeholder="mon-projet"
                  />
                </div>

                <div>
                  <label className="label">Description courte</label>
                  <input
                    type="text"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    className="input-field"
                    placeholder="Résumé en une phrase..."
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="label">Description détaillée</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field min-h-[150px]"
                    rows={5}
                    placeholder="Décrivez votre projet en détail..."
                  />
                </div>
              </div>
            )}

            {/* Media Section */}
            {activeSection === 'media' && (
              <div className="space-y-4">
                <div>
                  <label className="label">Image principale *</label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="btn-secondary"
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                      Uploader une image
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                  {formData.image_url && (
                    <div className="mt-3">
                      <img src={formData.image_url} alt="Preview" className="h-32 w-32 rounded-lg object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Galerie d'images</label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="btn-secondary"
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                      Ajouter des images
                    </button>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      multiple
                      className="hidden"
                      onChange={handleGalleryUpload}
                    />
                  </div>
                  {formData.gallery_urls.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {formData.gallery_urls.map((url, idx) => (
                        <div key={idx} className="relative">
                          <img src={url} alt={`Gallery ${idx}`} className="h-20 w-20 rounded-lg object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryUrl(url)}
                            className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">URL vidéo</label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="label">Code embed vidéo (YouTube, Vimeo...)</label>
                  <textarea
                    value={formData.video_embed_url}
                    onChange={(e) => setFormData({ ...formData, video_embed_url: e.target.value })}
                    className="input-field min-h-[80px]"
                    rows={3}
                    placeholder="<iframe>..."
                  />
                </div>
              </div>
            )}

            {/* Category Section */}
            {activeSection === 'category' && (
              <div className="space-y-4">
                <div>
                  <label className="label">Catégorie</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Design, Photographie..."
                  />
                </div>

                <div>
                  <label className="label">Sous-catégorie</label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Logo, Web design..."
                  />
                </div>

                <div>
                  <label className="label">Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.newTag}
                      onChange={(e) => setFormData({ ...formData, newTag: e.target.value })}
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
                    <span key={tag} className="badge bg-primary-50 text-primary-700">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-primary-900">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label">Technologies utilisées</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.newTechnology}
                  onChange={(e) => setFormData({ ...formData, newTechnology: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                  className="input-field flex-1"
                  placeholder="Ex: React, Node.js..."
                />
                <button type="button" onClick={addTechnology} className="btn-secondary">
                  <Plus size={18} />
                </button>
              </div>
              {formData.technologies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.technologies.map((tech) => (
                    <span key={tech} className="badge bg-accent-50 text-accent-700">
                      {tech}
                      <button type="button" onClick={() => removeTechnology(tech)} className="ml-1 hover:text-accent-900">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details Section */}
        {activeSection === 'details' && (
          <div className="space-y-4">
            <div>
              <label className="label">Date du projet</label>
              <input
                type="date"
                value={formData.project_date}
                onChange={(e) => setFormData({ ...formData, project_date: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Durée du projet</label>
              <input
                type="text"
                value={formData.project_duration}
                onChange={(e) => setFormData({ ...formData, project_duration: e.target.value })}
                className="input-field"
                placeholder="Ex: 3 mois, 2 semaines..."
              />
            </div>

            <div>
              <label className="label">Budget</label>
              <input
                type="text"
                value={formData.project_budget}
                onChange={(e) => setFormData({ ...formData, project_budget: e.target.value })}
                className="input-field"
                placeholder="Ex: 5000€, 10000-15000€..."
              />
            </div>

            <div>
              <label className="label">Nom du client</label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="input-field"
                placeholder="Nom de l'entreprise ou du client"
              />
            </div>

            <div>
              <label className="label">Logo du client</label>
              <input
                type="url"
                value={formData.client_logo_url}
                onChange={(e) => setFormData({ ...formData, client_logo_url: e.target.value })}
                className="input-field"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="label">Taille de l'équipe</label>
              <input
                type="number"
                value={formData.team_size}
                onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                className="input-field"
                placeholder="Nombre de personnes"
                min="1"
              />
            </div>
          </div>
        )}

        {/* Links Section */}
        {activeSection === 'links' && (
          <div className="space-y-4">
            <div>
              <label className="label">URL du projet</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="url"
                  value={formData.project_url}
                  onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                  className="input-field pl-9"
                  placeholder="https://mon-projet.com"
                />
              </div>
            </div>

            <div>
              <label className="label">GitHub</label>
              <div className="relative">
                <Github size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  className="input-field pl-9"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>

            <div>
              <label className="label">Behance</label>
              <div className="relative">
                <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="url"
                  value={formData.behance_url}
                  onChange={(e) => setFormData({ ...formData, behance_url: e.target.value })}
                  className="input-field pl-9"
                  placeholder="https://behance.net/..."
                />
              </div>
            </div>

            <div>
              <label className="label">Dribbble</label>
              <div className="relative">
                <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="url"
                  value={formData.dribbble_url}
                  onChange={(e) => setFormData({ ...formData, dribbble_url: e.target.value })}
                  className="input-field pl-9"
                  placeholder="https://dribbble.com/..."
                />
              </div>
            </div>

            <div>
              <label className="label">Figma</label>
              <div className="relative">
                <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="url"
                  value={formData.figma_url}
                  onChange={(e) => setFormData({ ...formData, figma_url: e.target.value })}
                  className="input-field pl-9"
                  placeholder="https://figma.com/..."
                />
              </div>
            </div>

            <div>
              <label className="label">Instagram</label>
              <div className="relative">
                <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  className="input-field pl-9"
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Status Section */}
        {activeSection === 'status' && (
          <div className="space-y-4">
            <div>
              <label className="label">Statut du projet</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="input-field"
              >
                <option value="planning">Planification</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
                <option value="on_hold">En pause</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="is_published" className="text-sm text-neutral-700">
                Publier ce projet (visible par les clients)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="is_featured" className="text-sm text-neutral-700">
                Mettre en avant (projet vedette)
              </label>
            </div>
          </div>
        )}

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
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-100">
                    <ImageIcon size={32} className="text-neutral-300" />
                  </div>
                )}

                {item.is_featured && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    ⭐ Vedette
                  </div>
                )}

                {!item.is_published && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-neutral-500 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Brouillon
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
                {item.short_description && (
                  <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{item.short_description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.category && (
                    <span className="badge bg-primary-50 text-primary-700">
                      {item.category}
                    </span>
                  )}
                  {item.status && (
                    <span className={`badge ${
                      item.status === 'completed' ? 'bg-green-50 text-green-700' :
                      item.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                      item.status === 'planning' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-neutral-50 text-neutral-700'
                    }`}>
                      {item.status === 'completed' ? 'Terminé' :
                       item.status === 'in_progress' ? 'En cours' :
                       item.status === 'planning' ? 'Planification' : 'En pause'}
                    </span>
                  )}
                  {item.project_date && (
                    <span className="badge bg-neutral-100 text-neutral-600">
                      {new Date(item.project_date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
                {(item.github_url || item.project_url) && (
                  <div className="mt-3 flex gap-2">
                    {item.github_url && (
                      <a href={item.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                        <Github size={14} />
                      </a>
                    )}
                    {item.project_url && (
                      <a href={item.project_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                        <Globe size={14} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
