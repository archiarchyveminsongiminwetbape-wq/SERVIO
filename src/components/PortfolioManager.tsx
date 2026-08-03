import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, GripVertical, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getPortfolioItems, createPortfolioItem, updatePortfolioItem, deletePortfolioItem, type PortfolioItem } from '@/services/portfolioService';
import ImageUpload from './ImageUpload';

export default function PortfolioManager() {
  const { user } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    category: '',
    project_date: '',
  });

  useEffect(() => {
    if (user) {
      loadPortfolio();
    }
  }, [user]);

  async function loadPortfolio() {
    if (!user) return;
    setLoading(true);
    const data = await getPortfolioItems(user.id);
    setItems(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (editingItem) {
      await updatePortfolioItem(editingItem.id, formData);
    } else {
      await createPortfolioItem({
        provider_id: user.id,
        ...formData,
        sort_order: items.length,
      });
    }

    setShowForm(false);
    setEditingItem(null);
    setFormData({ title: '', description: '', image_url: '', category: '', project_date: '' });
    loadPortfolio();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce projet ?')) return;
    await deletePortfolioItem(id);
    loadPortfolio();
  }

  function handleEdit(item: PortfolioItem) {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      image_url: item.image_url,
      category: item.category || '',
      project_date: item.project_date || '',
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ title: '', description: '', image_url: '', category: '', project_date: '' });
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
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          Ajouter un projet
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h4 className="mb-4 font-semibold text-neutral-900">
            {editingItem ? 'Modifier' : 'Nouneau'} projet
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
              <label className="label">Image</label>
              <ImageUpload
                currentUrl={formData.image_url}
                userId={user?.id || ''}
                type="avatar"
                aspectRatio="wide"
                onUrlChange={(url) => setFormData({ ...formData, image_url: url || '' })}
                label="Image du projet"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Catégorie</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Web design"
                />
              </div>
              <div>
                <label className="label">Date du projet</label>
                <input
                  type="date"
                  value={formData.project_date}
                  onChange={(e) => setFormData({ ...formData, project_date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

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
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white"
                  >
                    <Edit3 size={16} className="text-neutral-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white"
                  >
                    <Trash2 size={16} className="text-error-600" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-neutral-900">{item.title}</h4>
                {item.description && (
                  <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{item.description}</p>
                )}
                {item.category && (
                  <span className="mt-2 inline-block badge bg-primary-50 text-primary-700">
                    {item.category}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
