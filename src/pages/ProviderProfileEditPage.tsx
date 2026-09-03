import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Plus, Trash2, Upload, Briefcase, MapPin, Phone, Globe, Star, Calendar, Shield, Loader2, Camera, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { supabase } from '@/lib/supabase';
import { uploadAvatar, uploadBanner } from '@/lib/storage';
import type { ProviderProfile, Category } from '@/types';
import { countries } from '@/data/countries';

export default function ProviderProfileEditPage() {
  const { t } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
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
    country: '',
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
      .select('id, name, slug, icon, parent_id, sort_order')
      .order('sort_order');
    
    if (categoriesData) {
      setCategories(categoriesData as Category[]);
    }

    // Load provider profile
    const { data: profileData } = await supabase
      .from('provider_profiles')
      .select('id, user_id, business_name, slug, headline, description, avatar_url, banner_url, category_id, skills, experience_years, languages, certifications, city, country, service_area, remote_service, phone, website, social_links, price_range, availability, validation_status, validation_note')
      .eq('user_id', user.id)
      .order('rating_count', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (profileData) {
      setProviderProfile(profileData as unknown as ProviderProfile);
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
        country: profileData.country || '',
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
      .select('id, provider_id, title, description, photos, videos, video_thumbnails, tags, project_links, client_name, project_date, budget, location, featured, technologies_used, duration, team_size, context, objective, role, process, result, sort_order, created_at')
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
            country: formData.country,
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
            country: formData.country,
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
      alert(t.provider.saveError);
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

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    setUploadMsg(null);
    try {
      const publicUrl = await uploadAvatar(file, user.id);
      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
      setUploadMsg({ type: 'success', text: 'Photo de profil (avatar) téléversée avec succès.' });
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setUploadMsg({ type: 'error', text: err?.message || 'Erreur lors du téléversement de l\'avatar.' });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      setTimeout(() => setUploadMsg(null), 4000);
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingBanner(true);
    setUploadMsg(null);
    try {
      const publicUrl = await uploadBanner(file, user.id);
      setFormData((prev) => ({ ...prev, banner_url: publicUrl }));
      setUploadMsg({ type: 'success', text: 'Photo de couverture (bannière) téléversée avec succès.' });
    } catch (err: any) {
      console.error('Error uploading banner:', err);
      setUploadMsg({ type: 'error', text: err?.message || 'Erreur lors du téléversement de la bannière.' });
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      setTimeout(() => setUploadMsg(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">{t.provider.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleBannerFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {uploadMsg && (
        <div
          className={`mb-6 rounded-xl p-4 text-sm font-medium ${
            uploadMsg.type === 'success'
              ? 'bg-success-50 text-success-800 border border-success-200'
              : 'bg-error-50 text-error-800 border border-error-200'
          }`}
        >
          {uploadMsg.text}
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {providerProfile ? t.provider.editProfileTitle : t.provider.createProfileTitle}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {providerProfile ? t.provider.editProfileSubtitle : t.provider.createProfileSubtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/provider/dashboard')}
            className="btn-secondary"
          >
            <X size={18} />
            {t.provider.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? <span className="animate-spin">⏳</span> : <><Save size={18} /> {t.provider.save}</>}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-neutral-900">{t.provider.basicInformation}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">{t.provider.fields.businessName} *</label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="input-field"
                placeholder={t.provider.businessNamePlaceholder}
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
                placeholder={t.provider.slugPlaceholder}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">{t.provider.fields.headline}</label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="input-field"
                placeholder={t.provider.headlinePlaceholder}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">{t.provider.fields.description} *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[150px]"
                placeholder={t.provider.descriptionPlaceholder}
              />
            </div>
          </div>
        </div>

        {/* Category and Skills */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-neutral-900">{t.provider.categoryAndSkills}</h3>
          <div className="space-y-4">
            <div>
              <label className="label">{t.provider.fields.category} *</label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="input-field"
              >
                <option value="">{t.provider.selectCategory}</option>
                {categories
                  .filter((cat) => !cat.parent_id)
                  .map((parent) => (
                    <optgroup key={parent.id} label={parent.name}>
                      <option value={parent.id}>{parent.name}</option>
                      {categories
                        .filter((sub) => sub.parent_id === parent.id)
                        .map((sub) => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                    </optgroup>
                  ))}
              </select>
            </div>
            <div>
              <label className="label">{t.provider.fields.skills}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="input-field flex-1"
                  placeholder={t.provider.addSkill}
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
              <label className="label">{t.provider.yearsOfExperience}</label>
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
              <label className="label">{t.provider.fields.languages}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                  className="input-field flex-1"
                  placeholder={t.provider.addLanguage}
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
              <label className="label">{t.provider.fields.certifications}</label>
              <textarea
                value={formData.certifications}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                className="input-field min-h-[80px]"
                placeholder={t.provider.certificationsPlaceholder}
              />
            </div>
          </div>
        </div>

        {/* Location and Contact */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-neutral-900">{t.provider.contactInformation}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">{t.provider.fields.city}</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input-field"
                placeholder="Paris"
              />
            </div>
            <div>
              <label className="label">Pays</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="input-field"
              >
                <option value="">Sélectionner un pays</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t.provider.fields.serviceArea}</label>
              <input
                type="text"
                value={formData.service_area}
                onChange={(e) => setFormData({ ...formData, service_area: e.target.value })}
                className="input-field"
                placeholder={t.provider.serviceAreaPlaceholder}
              />
            </div>
            <div>
              <label className="label">{t.provider.fields.phone}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder={t.provider.phonePlaceholder}
              />
            </div>
            <div>
              <label className="label">{t.provider.fields.website}</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="input-field"
                placeholder={t.provider.websitePlaceholder}
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
                <span className="text-sm text-neutral-700">{t.provider.remoteServiceLabel}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing and Availability */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-neutral-900">{t.provider.pricingAndAvailability}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">{t.provider.fields.priceRange}</label>
              <input
                type="text"
                value={formData.price_range}
                onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                className="input-field"
                placeholder={t.provider.priceRangePlaceholder}
              />
            </div>
            <div>
              <label className="label">{t.provider.availabilityLabel}</label>
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
          <h3 className="text-lg font-semibold text-neutral-900 mb-1">Photos de profil et couverture</h3>
          <p className="text-sm text-neutral-500 mb-6">Ajoutez ou modifiez votre avatar et votre bannière pour valoriser votre profil auprès des clients.</p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Avatar Section */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
              <label className="text-sm font-semibold text-neutral-800 mb-2 block">{t.provider.fields.avatar}</label>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative h-20 w-20 rounded-2xl border-2 border-white bg-neutral-200 shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-neutral-400" />
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                      <Loader2 size={20} className="animate-spin" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="btn-secondary w-full justify-center text-xs py-2"
                  >
                    {uploadingAvatar ? (
                      <><Loader2 size={14} className="animate-spin" /> Téléversement...</>
                    ) : (
                      <><Upload size={14} /> Choisir une photo</>
                    )}
                  </button>
                  {formData.avatar_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar_url: '' })}
                      className="text-xs text-error-600 hover:underline block"
                    >
                      Supprimer la photo
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Ou saisir une URL directe :</label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  className="input-field text-xs"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Banner Section */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
              <label className="text-sm font-semibold text-neutral-800 mb-2 block">{t.provider.fields.banner}</label>
              <div className="relative h-24 w-full rounded-xl border border-neutral-200 bg-neutral-200 overflow-hidden mb-3 flex items-center justify-center">
                {formData.banner_url ? (
                  <img src={formData.banner_url} alt="Bannière" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center text-neutral-400">
                    <ImageIcon size={28} className="mx-auto mb-1 opacity-60" />
                    <span className="text-xs">Aucune bannière</span>
                  </div>
                )}
                {uploadingBanner && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="btn-secondary flex-1 justify-center text-xs py-2"
                >
                  {uploadingBanner ? (
                    <><Loader2 size={14} className="animate-spin" /> Téléversement...</>
                  ) : (
                    <><Upload size={14} /> Choisir une bannière</>
                  )}
                </button>
                {formData.banner_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, banner_url: '' })}
                    className="btn-ghost text-xs text-error-600 py-2"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Ou saisir une URL directe :</label>
                <input
                  type="url"
                  value={formData.banner_url}
                  onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                  className="input-field text-xs"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Validation Status */}
        {providerProfile && (
          <div className="card">
            <h3 className="mb-4 font-semibold text-neutral-900">{t.provider.validationStatus.pending}</h3>
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
                {providerProfile.validation_status === 'approved' ? t.provider.validationStatus.approved :
                 providerProfile.validation_status === 'rejected' ? t.provider.validationStatus.rejected :
                 providerProfile.validation_status === 'changes_requested' ? t.provider.validationStatus.changesRequested :
                 t.provider.validationStatus.pending}
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
