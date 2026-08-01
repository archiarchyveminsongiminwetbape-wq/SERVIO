import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Plus, Trash2, Upload, Briefcase, MapPin, Phone, Globe, Star, Calendar, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { ProviderProfile, Category } from '@/types';

export default function ProviderProfileEditPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    business_name: '',
    slug: '',
    headline: '',
    description: '',
    avatar_url: '',
    banner_url: '',
    category_id: '',
    skills: [] as string[],
    experience_years: '',
    languages: [] as string[],
    certifications: '',
    city: '',
    service_area: '',
    remote_service: false,
    phone: '',
    website: '',
    social_links: {} as Record<string, string>,
    price_range: '',
    availability: 'available' as const,
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    setLoading(true);
    
    // Load categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    
    if (categoriesData) {
      setCategories(categoriesData);
    }

    // Load provider profile
    const { data: profileData } = await supabase
      .from('provider_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData) {
      setProviderProfile(profileData);
      setFormData({
        business_name: profileData.business_name || '',
        slug: profileData.slug || '',
        headline: profileData.headline || '',
        description: profileData.description || '',
        avatar_url: profileData.avatar_url || '',
        banner_url: profileData.banner_url || '',
        category_id: profileData.category_id || '',
        skills: profileData.skills || [],
        experience_years: profileData.experience_years?.toString() || '',
        languages: profileData.languages || [],
        certifications: profileData.certifications || '',
        city: profileData.city || '',
        service_area: profileData.service_area || '',
        remote_service: profileData.remote_service || false,
        phone: profileData.phone || '',
        website: profileData.website || '',
        social_links: profileData.social_links || {},
        price_range: profileData.price_range || '',
        availability: profileData.availability || 'available',
      });
    }

    // Load portfolio items
    const { data: portfolioData } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('provider_id', profileData?.id)
      .order('sort_order');

    if (portfolioData) {
      setPortfolioItems(portfolioData);
    }

    setLoading(false);
  }

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      if (providerProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('provider_profiles')
          .update({
            business_name: formData.business_name,
            slug: formData.slug,
            headline: formData.headline,
            description: formData.description,
            avatar_url: formData.avatar_url,
            banner_url: formData.banner_url,
            category_id: formData.category_id || null,
            skills: formData.skills,
            experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
            languages: formData.languages,
            certifications: formData.certifications,
            city: formData.city,
            service_area: formData.service_area,
            remote_service: formData.remote_service,
            phone: formData.phone,
            website: formData.website,
            social_links: formData.social_links,
            price_range: formData.price_range,
            availability: formData.availability,
            updated_at: new Date().toISOString(),
          })
          .eq('id', providerProfile.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('provider_profiles')
          .insert({
            user_id: user.id,
            business_name: formData.business_name,
            slug: formData.slug,
            headline: formData.headline,
            description: formData.description,
            avatar_url: formData.avatar_url,
            banner_url: formData.banner_url,
            category_id: formData.category_id || null,
            skills: formData.skills,
            experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
            languages: formData.languages,
            certifications: formData.certifications,
            city: formData.city,
            service_area: formData.service_area,
            remote_service: formData.remote_service,
            phone: formData.phone,
            website: formData.website,
            social_links: formData.social_links,
            price_range: formData.price_range,
            availability: formData.availability,
            validation_status: 'pending',
          });

        if (error) throw error;
      }

      navigate('/provider/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erreur lors de la sauvegarde du profil');
    }

    setSaving(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData({ ...formData, languages: [...formData.languages, newLanguage.trim()] });
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setFormData({ ...formData, languages: formData.languages.filter(l => l !== language) });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {providerProfile ? 'Modifier mon profil' : 'Créer mon profil prestataire'}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {providerProfile ? 'Mettez à jour vos informations' : 'Créez votre portfolio professionnel'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/provider/dashboard')}
            className="btn-secondary"
          >
            <X size={18} />
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? <span className="animate-spin">⏳</span> : <><Save size={18} /> Enregistrer</>}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-neutral-900">Informations de base</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Nom de l'entreprise *</label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="input-field"
                placeholder="Votre entreprise"
              />
            </div>
            <div>
              <label className="label">Slug (URL) *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                className="input-field"
                placeholder="votre-entreprise"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Accroche</label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="input-field"
                placeholder="Une phrase qui décrit votre activité"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[150px]"
                placeholder="Décrivez vos services, votre expertise..."
              />
            </div>
          </div>
        </div>

        {/* Category and Skills */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-neutral-900">Catégorie et compétences</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Catégorie principale *</label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="input-field"
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Compétences</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="input-field flex-1"
                  placeholder="Ajouter une compétence"
                />
                <button type="button" onClick={addSkill} className="btn-secondary">
                  <Plus size={18} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-primary-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Années d'expérience</label>
              <input
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                className="input-field"
                placeholder="5"
              />
            </div>
            <div>
              <label className="label">Langues parlées</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                  className="input-field flex-1"
                  placeholder="Ajouter une langue"
                />
                <button type="button" onClick={addLanguage} className="btn-secondary">
                  <Plus size={18} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.languages.map((language) => (
                  <span
                    key={language}
                    className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-3 py-1 text-sm text-accent-700"
                  >
                    {language}
                    <button
                      type="button"
                      onClick={() => removeLanguage(language)}
                      className="hover:text-accent-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Certifications</label>
              <textarea
                value={formData.certifications}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                className="input-field min-h-[80px]"
                placeholder="Listez vos certifications et diplômes"
              />
            </div>
          </div>
        </div>

        {/* Location and Contact */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-neutral-900">Localisation et contact</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Ville</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input-field"
                placeholder="Paris"
              />
            </div>
            <div>
              <label className="label">Zone de service</label>
              <input
                type="text"
                value={formData.service_area}
                onChange={(e) => setFormData({ ...formData, service_area: e.target.value })}
                className="input-field"
                placeholder="Île-de-France (50km)"
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <div>
              <label className="label">Site web</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="input-field"
                placeholder="https://votre-site.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.remote_service}
                  onChange={(e) => setFormData({ ...formData, remote_service: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Service à distance disponible</span>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing and Availability */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-neutral-900">Tarification et disponibilité</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Gamme de prix</label>
              <input
                type="text"
                value={formData.price_range}
                onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                className="input-field"
                placeholder="50€ - 150€/heure"
              />
            </div>
            <div>
              <label className="label">Disponibilité</label>
              <select
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value as any })}
                className="input-field"
              >
                <option value="available">Disponible</option>
                <option value="busy">Occupé</option>
                <option value="unavailable">Indisponible</option>
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-neutral-900">Images</h3>
          <div className="space-y-4">
            <div>
              <label className="label">URL de l'avatar</label>
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                className="input-field"
                placeholder="https://..."
              />
              {formData.avatar_url && (
                <img src={formData.avatar_url} alt="Avatar" className="mt-2 h-20 w-20 rounded-full object-cover" />
              )}
            </div>
            <div>
              <label className="label">URL de la bannière</label>
              <input
                type="url"
                value={formData.banner_url}
                onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                className="input-field"
                placeholder="https://..."
              />
              {formData.banner_url && (
                <img src={formData.banner_url} alt="Banner" className="mt-2 h-32 w-full rounded-lg object-cover" />
              )}
            </div>
          </div>
        </div>

        {/* Validation Status */}
        {providerProfile && (
          <div className="card">
            <h3 className="mb-4 font-semibold text-neutral-900">Statut de validation</h3>
            <div className="flex items-center gap-2">
              <Shield size={20} className={
                providerProfile.validation_status === 'approved' ? 'text-success-600' :
                providerProfile.validation_status === 'rejected' ? 'text-error-600' :
                'text-warning-600'
              } />
              <span className={`font-medium ${
                providerProfile.validation_status === 'approved' ? 'text-success-700' :
                providerProfile.validation_status === 'rejected' ? 'text-error-700' :
                'text-warning-700'
              }`}>
                {providerProfile.validation_status === 'approved' ? 'Approuvé' :
                 providerProfile.validation_status === 'rejected' ? 'Rejeté' :
                 providerProfile.validation_status === 'changes_requested' ? 'Modifications demandées' :
                 'En attente de validation'}
              </span>
            </div>
            {providerProfile.validation_note && (
              <p className="mt-2 text-sm text-neutral-600">{providerProfile.validation_note}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
