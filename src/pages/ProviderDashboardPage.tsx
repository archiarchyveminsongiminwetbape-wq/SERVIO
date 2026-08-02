import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, MessageSquare, BarChart3, Settings,
  Loader2, Plus, Trash2, Edit3, Save, X, Eye, EyeOff, AlertCircle,
  CheckCircle2, Clock, XCircle, Upload, Star, TrendingUp, Users, MessageCircle, Globe, CreditCard, Calendar, MapPin, CalendarPlus, CalendarCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { ProviderProfile, PortfolioItem, Category, Review, AvailabilitySlot, Booking } from '@/types';
import { slugify, formatDate } from '@/lib/utils';
import StarRating from '@/components/StarRating';
import { BentoGrid, BentoCard } from '@/components/BentoGrid';
import { BentoStatCard, BentoFeatureCard } from '@/components/BentoCard';
import { countries } from '@/data/countries';
import { currencies } from '@/data/currencies';
import ImageUpload from '@/components/ImageUpload';

type Tab = 'overview' | 'portfolio' | 'profile' | 'reviews' | 'availability' | 'bookings';

export default function ProviderDashboardPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [skillsInput, setSkillsInput] = useState('');
  const [languagesInput, setLanguagesInput] = useState('');

  // Portfolio form state
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({ title: '', description: '', photos: [''], tags: '' });

  // Availability form state
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotForm, setSlotForm] = useState({ date: '', start_time: '', end_time: '', notes: '' });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (profile && profile.role !== 'provider') {
        navigate('/');
      }
    }
  }, [authLoading, user, profile, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    const [provRes, catRes] = await Promise.all([
      supabase.from('provider_profiles').select('*, category:categories(*)').eq('user_id', user.id).maybeSingle(),
      supabase.from('categories').select('*').order('sort_order'),
    ]);

    const prov = provRes.data as ProviderProfile | null;
    setProvider(prov);
    setCategories(catRes.data as Category[] ?? []);

    if (prov) {
      setForm({
        business_name: prov.business_name,
        headline: prov.headline ?? '',
        description: prov.description ?? '',
        category_id: prov.category_id ?? '',
        city: prov.city ?? '',
        country: (prov as any).country ?? 'FR',
        service_area: prov.service_area ?? '',
        remote_service: prov.remote_service,
        phone: prov.phone ?? '',
        website: prov.website ?? '',
        price_range: prov.price_range ?? '',
        currency: (prov as any).currency ?? 'EUR',
        availability: prov.availability,
        experience_years: prov.experience_years ?? '',
        certifications: prov.certifications ?? '',
        avatar_url: prov.avatar_url ?? '',
        banner_url: prov.banner_url ?? '',
      });
      setSkillsInput(prov.skills.join(', '));
      setLanguagesInput(prov.languages.join(', '));

      const [portRes, revRes, slotsRes, bookingsRes] = await Promise.all([
        supabase.from('portfolio_items').select('*').eq('provider_id', prov.id).order('sort_order'),
        supabase.from('reviews').select('*').eq('provider_id', prov.id).order('created_at', { ascending: false }),
        supabase.from('availability_slots').select('*').eq('provider_id', prov.id).order('date', { ascending: true }),
        supabase.from('bookings').select('*, client:profiles(*)').eq('provider_id', prov.id).order('scheduled_at', { ascending: false }),
      ]);
      setPortfolio(portRes.data as PortfolioItem[] ?? []);
      setReviews(revRes.data as Review[] ?? []);
      setAvailabilitySlots(slotsRes.data as AvailabilitySlot[] ?? []);
      setBookings(bookingsRes.data as Booking[] ?? []);
    }
    setLoading(false);
  }

  async function saveProfile() {
    if (!provider || !user) return;
    setSaving(true);
    setSaveMsg(null);

    const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const languages = languagesInput.split(',').map((s) => s.trim()).filter(Boolean);

    const { error } = await supabase
      .from('provider_profiles')
      .update({
        business_name: form.business_name,
        headline: form.headline,
        description: form.description,
        category_id: form.category_id || null,
        city: form.city || null,
        country: form.country || null,
        service_area: form.service_area || null,
        remote_service: form.remote_service,
        phone: form.phone || null,
        website: form.website || null,
        price_range: form.price_range || null,
        currency: form.currency || null,
        availability: form.availability,
        experience_years: form.experience_years ? parseInt(form.experience_years as string) : null,
        certifications: form.certifications || null,
        skills,
        languages,
        validation_status: provider.validation_status === 'approved' ? 'approved' : 'pending',
      })
      .eq('id', provider.id);

    if (error) {
      setSaveMsg({ type: 'error', text: error.message });
    } else {
      setSaveMsg({ type: 'success', text: 'Profil mis à jour avec succès.' });
      await loadData();
      await refreshProfile();
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(null), 4000);
  }

  async function createProfile() {
    if (!user || !profile) return;
    setSaving(true);
    const slug = slugify(profile.full_name ?? 'prestataire') + '-' + Date.now().toString().slice(-4);

    const { data, error } = await supabase
      .from('provider_profiles')
      .insert({
        user_id: user.id,
        business_name: profile.full_name ?? 'Mon entreprise',
        slug,
        headline: 'Nouveau prestataire',
        description: '',
        skills: [],
        languages: ['Français'],
      })
      .select('*, category:categories(*)')
      .single();

    if (error) {
      setSaveMsg({ type: 'error', text: error.message });
    } else {
      setProvider(data as ProviderProfile);
      setForm({
        business_name: data?.business_name,
        headline: '',
        description: '',
        category_id: '',
        city: '',
        service_area: '',
        remote_service: false,
        phone: '',
        website: '',
        price_range: '',
        availability: 'available',
        experience_years: '',
        certifications: '',
        avatar_url: '',
        banner_url: '',
      });
      setSkillsInput('');
      setLanguagesInput('Français');
      setTab('profile');
    }
    setSaving(false);
  }

  async function savePortfolioItem() {
    if (!provider) return;
    setSaving(true);
    const photos = itemForm.photos.filter((p) => p.trim());
    const tags = itemForm.tags.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingItem) {
      const { error } = await supabase
        .from('portfolio_items')
        .update({
          title: itemForm.title,
          description: itemForm.description,
          photos,
          tags,
        })
        .eq('id', editingItem.id);
      if (error) setSaveMsg({ type: 'error', text: error.message });
    } else {
      const { error } = await supabase
        .from('portfolio_items')
        .insert({
          provider_id: provider.id,
          title: itemForm.title,
          description: itemForm.description,
          photos,
          tags,
          sort_order: portfolio.length,
        });
      if (error) setSaveMsg({ type: 'error', text: error.message });
    }

    if (!saveMsg) {
      setShowItemForm(false);
      setEditingItem(null);
      setItemForm({ title: '', description: '', photos: [''], tags: '' });
      await loadData();
    }
    setSaving(false);
  }

  async function deletePortfolioItem(id: string) {
    if (!provider) return;
    setSaving(true);
    const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
    if (!error) {
      setPortfolio(portfolio.filter((p) => p.id !== id));
    }
    setSaving(false);
  }

  async function saveAvailabilitySlot() {
    if (!provider) return;
    setSaving(true);

    const { error } = await supabase.from('availability_slots').insert({
      provider_id: provider.id,
      date: slotForm.date,
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
      notes: slotForm.notes || null,
      is_available: true,
    });

    if (!error) {
      await loadData();
      setSlotForm({ date: '', start_time: '', end_time: '', notes: '' });
      setShowSlotForm(false);
    }
    setSaving(false);
  }

  async function deleteAvailabilitySlot(id: string) {
    if (!provider) return;
    setSaving(true);
    const { error } = await supabase.from('availability_slots').delete().eq('id', id);
    if (!error) {
      setAvailabilitySlots(availabilitySlots.filter((s) => s.id !== id));
    }
    setSaving(false);
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    if (!provider) return;
    setSaving(true);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
    if (!error) {
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
    }
    setSaving(false);
  }

  async function respondToReview(reviewId: string) {
    const response = prompt('Votre réponse :');
    if (!response?.trim()) return;
    await supabase
      .from('reviews')
      .update({
        provider_response: response.trim(),
        provider_response_at: new Date().toISOString(),
      })
      .eq('id', reviewId);
    await loadData();
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="card p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <Settings size={28} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-neutral-900">Créez votre profil prestataire</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Pour commencer à recevoir des demandes, créez votre profil professionnel.
            Il sera soumis à validation par notre équipe.
          </p>
          <button onClick={createProfile} disabled={saving} className="btn-primary mt-6">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Créer mon profil
          </button>
        </div>
      </div>
    );
  }

  const statusInfo: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    pending: { label: 'En attente de validation', icon: Clock, color: 'text-accent-600 bg-accent-50' },
    approved: { label: 'Profil validé', icon: CheckCircle2, color: 'text-success-600 bg-success-50' },
    rejected: { label: 'Profil refusé', icon: XCircle, color: 'text-error-600 bg-error-50' },
    changes_requested: { label: 'Modifications demandées', icon: AlertCircle, color: 'text-warning-600 bg-warning-50' },
  };
  const si = statusInfo[provider.validation_status] ?? statusInfo.pending;
  const StatusIcon = si.icon;

  // Profile completion calculation
  const completionFields = [
    !!provider.business_name,
    !!provider.headline,
    !!provider.description,
    !!provider.avatar_url,
    !!provider.banner_url,
    !!provider.category_id,
    provider.skills.length > 0,
    !!provider.city,
    !!provider.phone,
    !!provider.price_range,
    provider.languages.length > 0,
    !!provider.experience_years,
  ];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'portfolio', label: 'Réalisations', icon: FolderOpen },
    { id: 'profile', label: 'Mon profil', icon: Settings },
    { id: 'reviews', label: 'Avis', icon: Star },
    { id: 'availability', label: 'Disponibilités', icon: CalendarPlus },
    { id: 'bookings', label: 'Rendez-vous', icon: CalendarCheck },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Espace prestataire</h1>
          <p className="mt-1 text-sm text-neutral-600">{provider.business_name}</p>
        </div>
        <span className={`badge ${si.color}`}>
          <StatusIcon size={14} />
          {si.label}
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id ? 'border-b-2 border-primary-600 text-primary-600' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {saveMsg && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
          saveMsg.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'
        }`}>
          {saveMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {saveMsg.text}
        </div>
      )}

      {/* Overview - Bento Grid */}
      {tab === 'overview' && (
        <BentoGrid>
          <BentoStatCard 
            icon={Eye} 
            value={provider.profile_views} 
            label="Vues du profil" 
            variant="default"
          />
          <BentoStatCard 
            icon={Star} 
            value={provider.rating_avg.toFixed(1)} 
            label={`${provider.rating_count} avis`}
            variant="primary"
          />
          <BentoStatCard 
            icon={FolderOpen} 
            value={portfolio.length} 
            label="Réalisations" 
            variant="default"
          />
          
          <BentoCard colSpan={2} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">Complétion du profil</h3>
              <span className={`text-sm font-bold ${completionPct >= 80 ? 'text-success-600' : completionPct >= 50 ? 'text-accent-600' : 'text-error-600'}`}>
                {completionPct}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completionPct >= 80 ? 'bg-success-500' : completionPct >= 50 ? 'bg-accent-500' : 'bg-error-500'
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-neutral-500">
              {completionPct >= 80
                ? 'Votre profil est bien complet ! Continuez à ajouter des réalisations pour attirer plus de clients.'
                : 'Complétez votre profil pour augmenter votre visibilité et attirer plus de clients.'}
            </p>
          </BentoCard>

          <BentoFeatureCard 
            icon={TrendingUp}
            title="Statistiques"
            description="Voir vos performances et tendances"
            variant="primary"
          />

          {provider.validation_note && (
            <BentoCard colSpan={3} className="p-5 bg-warning-50 border-warning-200">
              <p className="text-sm font-semibold text-neutral-900">Note de l'administration</p>
              <p className="mt-1 text-sm text-neutral-600">{provider.validation_note}</p>
            </BentoCard>
          )}

          <BentoCard colSpan={3} className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Aperçu de votre profil public</h3>
            <div className="flex items-center gap-4">
              {provider.avatar_url ? (
                <img src={provider.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-xl font-bold text-primary-700">
                  {provider.business_name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-neutral-900">{provider.business_name}</p>
                <p className="text-sm text-neutral-500">{provider.headline}</p>
                <div className="mt-1 flex items-center gap-3">
                  <StarRating rating={provider.rating_avg} size={14} showValue />
                  {provider.city && <span className="text-xs text-neutral-500">{provider.city}</span>}
                </div>
              </div>
              <a
                href={`/#/provider/${provider.slug}`}
                onClick={(e) => { e.preventDefault(); navigate(`/provider/${provider.slug}`); }}
                className="btn-secondary"
              >
                <Eye size={16} />
                Voir le profil
              </a>
            </div>
          </BentoCard>
        </BentoGrid>
      )}

      {/* Portfolio */}
      {tab === 'portfolio' && (
        <div>
          <div className="mb-4 flex justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Réalisations ({portfolio.length})</h3>
            <button
              onClick={() => {
                setEditingItem(null);
                setItemForm({ title: '', description: '', photos: [''], tags: '' });
                setShowItemForm(true);
              }}
              className="btn-primary"
            >
              <Plus size={18} />
              Ajouter
            </button>
          </div>

          {showItemForm && (
            <div className="card mb-6 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold text-neutral-900">
                  {editingItem ? 'Modifier' : 'Nouvelle'} réalisation
                </h4>
                <button onClick={() => setShowItemForm(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Titre</label>
                  <input
                    type="text"
                    value={itemForm.title}
                    onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Séance portrait en studio"
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Décrivez cette réalisation..."
                  />
                </div>
                <div>
                  <label className="label">URLs des photos (une par ligne)</label>
                  {itemForm.photos.map((photo, i) => (
                    <div key={i} className="mb-2 flex gap-2">
                      <input
                        type="url"
                        value={photo}
                        onChange={(e) => {
                          const photos = [...itemForm.photos];
                          photos[i] = e.target.value;
                          setItemForm({ ...itemForm, photos });
                        }}
                        className="input-field"
                        placeholder="https://..."
                      />
                      {itemForm.photos.length > 1 && (
                        <button
                          onClick={() => setItemForm({ ...itemForm, photos: itemForm.photos.filter((_, j) => j !== i) })}
                          className="btn-secondary px-3"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setItemForm({ ...itemForm, photos: [...itemForm.photos, ''] })}
                    className="btn-ghost text-sm"
                  >
                    <Plus size={14} />
                    Ajouter une photo
                  </button>
                </div>
                <div>
                  <label className="label">Tags (séparés par des virgules)</label>
                  <input
                    type="text"
                    value={itemForm.tags}
                    onChange={(e) => setItemForm({ ...itemForm, tags: e.target.value })}
                    className="input-field"
                    placeholder="portrait, studio, éclairage"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowItemForm(false)} className="btn-secondary">Annuler</button>
                  <button onClick={savePortfolioItem} disabled={saving || !itemForm.title} className="btn-primary">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          )}

          {portfolio.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.map((item) => (
                <div key={item.id} className="card group overflow-hidden">
                  {item.photos[0] && (
                    <div className="relative h-48 overflow-hidden bg-neutral-100">
                      <img src={item.photos[0]} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-semibold text-neutral-900">{item.title}</h4>
                    {item.description && <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{item.description}</p>}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setItemForm({
                            title: item.title,
                            description: item.description ?? '',
                            photos: item.photos.length ? item.photos : [''],
                            tags: item.tags.join(', '),
                          });
                          setShowItemForm(true);
                        }}
                        className="btn-ghost text-sm"
                      >
                        <Edit3 size={14} />
                        Modifier
                      </button>
                      <button
                        onClick={() => deletePortfolioItem(item.id)}
                        className="btn-ghost text-sm text-error-600 hover:bg-error-50"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen size={48} className="text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">Aucune réalisation publiée</p>
              <p className="text-xs text-neutral-400">Ajoutez vos meilleurs projets pour mettre en valeur votre savoir-faire</p>
            </div>
          )}
        </div>
      )}

      {/* Profile editing */}
      {tab === 'profile' && (
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-900">Informations générales</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Nom / Nom d'entreprise</label>
                <input
                  type="text"
                  value={form.business_name as string ?? ''}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Secteur d'activité</label>
                <select
                  value={form.category_id as string ?? ''}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Sélectionner...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Titre / accroche</label>
                <input
                  type="text"
                  value={form.headline as string ?? ''}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Photographe professionnel — Portraits, Mariages"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Présentation</label>
                <textarea
                  value={form.description as string ?? ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field resize-none"
                  rows={5}
                  placeholder="Décrivez votre activité, votre expérience, ce qui vous différencie..."
                />
              </div>
              <div>
                <label className="label">Compétences (séparées par des virgules)</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="input-field"
                  placeholder="Portrait, Mariage, Retouche"
                />
              </div>
              <div>
                <label className="label">Langues parlées</label>
                <input
                  type="text"
                  value={languagesInput}
                  onChange={(e) => setLanguagesInput(e.target.value)}
                  className="input-field"
                  placeholder="Français, Anglais"
                />
              </div>
              <div>
                <label className="label">Années d'expérience</label>
                <input
                  type="number"
                  value={form.experience_years as string ?? ''}
                  onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                  className="input-field"
                  placeholder="5"
                />
              </div>
              <div>
                <label className="label">Certifications / Diplômes</label>
                <input
                  type="text"
                  value={form.certifications as string ?? ''}
                  onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                  className="input-field"
                  placeholder="CAP, Master, etc."
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-900">Localisation & Contact</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Ville</label>
                <input
                  type="text"
                  value={form.city as string ?? ''}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="input-field"
                  placeholder="Paris"
                />
              </div>
              <div>
                <label className="label">Pays</label>
                <select
                  value={form.country as string ?? 'FR'}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="input-field"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input
                  type="tel"
                  value={form.phone as string ?? ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <div>
                <label className="label">Site web</label>
                <input
                  type="url"
                  value={form.website as string ?? ''}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="label">Zone d'intervention</label>
                <input
                  type="text"
                  value={form.service_area as string ?? ''}
                  onChange={(e) => setForm({ ...form, service_area: e.target.value })}
                  className="input-field"
                  placeholder="Île-de-France"
                />
              </div>
              <div>
                <label className="label">Service à distance</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.remote_service as boolean ?? false}
                    onChange={(e) => setForm({ ...form, remote_service: e.target.checked })}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Proposer des services à distance</span>
                </label>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-900">Tarifs & Disponibilité</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Gamme de prix</label>
                <select
                  value={form.price_range as string ?? ''}
                  onChange={(e) => setForm({ ...form, price_range: e.target.value })}
                  className="input-field"
                >
                  <option value="">Sélectionner...</option>
                  <option value="€">€ (Économique)</option>
                  <option value="€€">€€ (Standard)</option>
                  <option value="€€€">€€€ (Premium)</option>
                </select>
              </div>
              <div>
                <label className="label">Devise</label>
                <select
                  value={form.currency as string ?? 'EUR'}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="input-field"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Disponibilité</label>
                <select
                  value={form.availability as string ?? 'available'}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  className="input-field"
                >
                  <option value="available">Disponible</option>
                  <option value="busy">Sur mission</option>
                  <option value="unavailable">Indisponible</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-900">Images</h3>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ImageUpload
                currentUrl={form.avatar_url as string || null}
                userId={user?.id || ''}
                type="avatar"
                aspectRatio="square"
                onUrlChange={(url) => setForm({ ...form, avatar_url: url || '' })}
                label="Avatar"
              />
              <ImageUpload
                currentUrl={form.banner_url as string || null}
                userId={user?.id || ''}
                type="banner"
                aspectRatio="wide"
                onUrlChange={(url) => setForm({ ...form, banner_url: url || '' })}
                label="Bannière"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setTab('overview')} className="btn-secondary">Annuler</button>
            <button onClick={saveProfile} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Reviews */}
      {tab === 'reviews' && (
        <div className="mx-auto max-w-3xl">
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <StarRating rating={review.rating} size={16} showValue />
                      <p className="mt-2 text-sm text-neutral-600">{review.comment}</p>
                      <p className="mt-2 text-xs text-neutral-400">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  {review.provider_response ? (
                    <div className="mt-3 rounded-lg bg-neutral-50 p-3">
                      <p className="text-xs font-semibold text-neutral-700">Votre réponse</p>
                      <p className="mt-1 text-sm text-neutral-600">{review.provider_response}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => respondToReview(review.id)}
                      className="btn-ghost mt-3 text-sm"
                    >
                      <MessageSquare size={14} />
                      Répondre
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Star size={48} className="text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">Aucun avis pour le moment</p>
            </div>
          )}
        </div>
      )}

      {/* Availability */}
      {tab === 'availability' && (
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-neutral-900">Créneaux de disponibilité ({availabilitySlots.length})</h3>
            <button
              onClick={() => setShowSlotForm(true)}
              className="btn-primary"
            >
              <CalendarPlus size={18} />
              Ajouter un créneau
            </button>
          </div>

          {showSlotForm && (
            <div className="card mb-6 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold text-neutral-900">Nouveau créneau</h4>
                <button onClick={() => setShowSlotForm(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={slotForm.date}
                    onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Heure de début</label>
                  <input
                    type="time"
                    value={slotForm.start_time}
                    onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Heure de fin</label>
                  <input
                    type="time"
                    value={slotForm.end_time}
                    onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Notes (optionnel)</label>
                  <input
                    type="text"
                    value={slotForm.notes}
                    onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Préférence matin"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowSlotForm(false)} className="btn-secondary">Annuler</button>
                <button onClick={saveAvailabilitySlot} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          {availabilitySlots.length > 0 ? (
            <div className="space-y-3">
              {availabilitySlots.map((slot) => (
                <div key={slot.id} className={`card p-4 ${!slot.is_available ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">
                          {new Date(slot.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {slot.start_time} - {slot.end_time}
                        </p>
                        {slot.notes && (
                          <p className="text-xs text-neutral-500 mt-1">{slot.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAvailabilitySlot(slot.id, !slot.is_available)}
                        className={`btn-ghost ${slot.is_available ? 'text-success-600' : 'text-neutral-400'}`}
                        title={slot.is_available ? 'Marquer indisponible' : 'Marquer disponible'}
                      >
                        {slot.is_available ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      </button>
                      <button
                        onClick={() => deleteAvailabilitySlot(slot.id)}
                        className="btn-ghost text-error-600"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <CalendarPlus size={48} className="text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">Aucun créneau de disponibilité</p>
              <p className="text-xs text-neutral-400 mt-1">Ajoutez vos créneaux pour permettre aux clients de réserver</p>
            </div>
          )}
        </div>
      )}

      {/* Bookings */}
      {tab === 'bookings' && (
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Rendez-vous ({bookings.length})</h3>
          </div>

          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const client = (booking as any).client;
                const statusInfo: Record<string, { label: string; color: string }> = {
                  pending: { label: 'En attente', color: 'bg-warning-100 text-warning-700' },
                  confirmed: { label: 'Confirmé', color: 'bg-success-100 text-success-700' },
                  completed: { label: 'Terminé', color: 'bg-neutral-100 text-neutral-700' },
                  cancelled: { label: 'Annulé', color: 'bg-error-100 text-error-700' },
                  no_show: { label: 'Absent', color: 'bg-error-100 text-error-700' },
                };
                const status = statusInfo[booking.status] || statusInfo.pending;

                return (
                  <div key={booking.id} className="card p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-xl font-bold text-primary-700">
                          {client?.full_name?.[0] || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-neutral-900">{client?.full_name || 'Client'}</h3>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-neutral-600">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} />
                              {formatDate(booking.scheduled_at)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={14} />
                              {new Date(booking.scheduled_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              {booking.location_type === 'remote' ? (
                                <>
                                  <Video size={14} />
                                  Visioconférence
                                </>
                              ) : (
                                <>
                                  <MapPin size={14} />
                                  {booking.location_address || 'Adresse non spécifiée'}
                                </>
                              )}
                            </div>
                            {booking.price && (
                              <div className="flex items-center gap-2">
                                <CreditCard size={14} />
                                {booking.price} {booking.currency}
                              </div>
                            )}
                          </div>
                          {booking.notes && (
                            <p className="mt-2 text-sm text-neutral-500 italic">"{booking.notes}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="btn-ghost text-success-600"
                              title="Accepter"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="btn-ghost text-error-600"
                              title="Refuser"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            className="btn-ghost text-primary-600"
                            title="Marquer terminé"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/messages`)}
                          className="btn-secondary"
                          title="Contacter"
                        >
                          <MessageSquare size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <CalendarCheck size={48} className="text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">Aucun rendez-vous</p>
              <p className="text-xs text-neutral-400 mt-1">Vous recevrez les demandes de rendez-vous ici</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
