import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, MessageSquare, BarChart3, Settings,
  Loader2, Plus, Trash2, Edit3, Save, X, Eye, EyeOff, AlertCircle,
  CheckCircle2, Clock, XCircle, Upload, Star, TrendingUp, Users, MessageCircle, Globe, CreditCard, Calendar, MapPin,
  Play, Code, FileText, ExternalLink, Camera, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { uploadAvatar, uploadBanner, uploadPortfolioPhoto } from '@/lib/storage';
import type { ProviderProfile, PortfolioItem, Category, Review } from '@/types';
import { slugify, formatDate } from '@/lib/utils';
import StarRating from '@/components/StarRating';
import { BentoGrid, BentoCard } from '@/components/BentoGrid';
import { BentoStatCard, BentoFeatureCard } from '@/components/BentoCard';
import { countries } from '@/data/countries';
import { currencies } from '@/data/currencies';

type Tab = 'overview' | 'portfolio' | 'profile' | 'reviews' | 'availability';

export default function ProviderDashboardPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [skillsInput, setSkillsInput] = useState('');
  const [languagesInput, setLanguagesInput] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  // Portfolio form state
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    photos: [] as string[],
    videos: [] as string[],
    video_thumbnails: [] as string[],
    tags: '',
    project_links: [] as { label: string; url: string; type?: 'demo' | 'repo' | 'case-study' | 'live' | 'other' }[],
    client_name: '',
    project_date: '',
    budget: '',
    location: '',
    featured: false,
    technologies_used: '',
    duration: '',
    team_size: '',
    // ===== PROFESSIONAL PORTFOLIO ELEMENTS =====
    context: '',
    objective: '',
    role: '',
    process: '',
    result: ''
  });

  // Normalize/validate URLs
  function ensureUrl(raw: string): string {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Availability form state
  const [availabilitySchedule, setAvailabilitySchedule] = useState<Record<string, { start: string; end: string; available: boolean }>>({
    monday: { start: '09:00', end: '18:00', available: true },
    tuesday: { start: '09:00', end: '18:00', available: true },
    wednesday: { start: '09:00', end: '18:00', available: true },
    thursday: { start: '09:00', end: '18:00', available: true },
    friday: { start: '09:00', end: '18:00', available: true },
    saturday: { start: '09:00', end: '12:00', available: false },
    sunday: { start: '09:00', end: '12:00', available: false },
  });

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
      setSkillsInput(Array.isArray(prov.skills) ? prov.skills.join(', ') : '');
      setLanguagesInput(Array.isArray(prov.languages) ? prov.languages.join(', ') : '');

      const [portRes, revRes] = await Promise.all([
        supabase.from('portfolio_items').select('*').eq('provider_id', prov.id).order('sort_order'),
        supabase.from('reviews').select('*').eq('provider_id', prov.id).order('created_at', { ascending: false }),
      ]);
      setPortfolio(portRes.data as PortfolioItem[] ?? []);
      setReviews(revRes.data as Review[] ?? []);
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
      setSaveMsg({ type: 'success', text: t.auth.loginSuccess });
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
    let targetProviderId = provider?.id;
    if (!targetProviderId && user) {
      // Try to find existing provider profile
      const { data: existingProvider, error: findError } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (findError) {
        console.error('Error finding provider profile:', findError);
        setSaveMsg({ type: 'error', text: `Erreur lors de la recherche du profil: ${findError.message}` });
        return;
      }

      if (existingProvider) {
        targetProviderId = existingProvider.id;
      } else {
        // Create a new provider profile
        const slug = slugify((profile as any)?.full_name || 'prestataire') + '-' + Date.now().toString().slice(-4);
        const { data: newProvider, error: newProviderError } = await supabase
          .from('provider_profiles')
          .insert({
            user_id: user.id,
            business_name: (profile as any)?.full_name || 'Mon entreprise',
            slug,
            validation_status: 'pending'
          })
          .select('id')
          .single();

        if (newProviderError) {
          console.error('Error creating provider profile:', newProviderError);
          setSaveMsg({ type: 'error', text: `Erreur lors de la création du profil prestataire: ${newProviderError.message}` });
          return;
        }

        targetProviderId = newProvider.id;
      }
    }

    if (!targetProviderId) {
      setSaveMsg({ type: 'error', text: 'Aucun profil prestataire trouvé. Veuillez créer votre profil prestataire d\'abord.' });
      return;
    }

    const photos = itemForm.photos.map((p) => p.trim()).filter(Boolean);
    const videos = itemForm.videos.map((v) => v.trim()).filter(Boolean);
    const videoThumbnails = itemForm.video_thumbnails.map((t) => t.trim()).filter(Boolean);
    const tags = itemForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const technologiesUsed = itemForm.technologies_used.split(',').map((t) => t.trim()).filter(Boolean);
    const projectLinks = (itemForm.project_links as { label: string; url: string; type?: string }[])
      .map(l => ({ label: l.label?.trim() || '', url: ensureUrl(l.url || ''), type: (l.type as any) || 'other' }))
      .filter(l => l.url);

    // Validate URLs
    for (const l of projectLinks) {
      try {
        // eslint-disable-next-line no-new
        new URL(l.url);
      } catch (e) {
        setSaveMsg({ type: 'error', text: `URL invalide : ${l.url}` });
        return;
      }
    }

    console.log('Using provider_id:', targetProviderId);
    setSaving(true);
    setSaveMsg(null);

    const basePayload: Record<string, any> = {
      title: itemForm.title,
      description: itemForm.description,
      photos,
      videos,
      video_thumbnails: videoThumbnails,
      tags,
      project_links: projectLinks,
      client_name: itemForm.client_name || null,
      project_date: itemForm.project_date || null,
      budget: itemForm.budget || null,
      location: itemForm.location || null,
      featured: itemForm.featured,
      technologies_used: technologiesUsed,
      duration: itemForm.duration || null,
      team_size: itemForm.team_size ? parseInt(itemForm.team_size) : null,
    };

    const fullPayload: Record<string, any> = {
      ...basePayload,
      context: itemForm.context || null,
      objective: itemForm.objective || null,
      role: itemForm.role || null,
      process: itemForm.process || null,
      result: itemForm.result || null,
    };

    if (editingItem) {
      // Prevent updating items that don't belong to this user's provider
      if (editingItem.provider_id !== targetProviderId) {
        setSaveMsg({ type: 'error', text: 'Impossible de modifier : cette réalisation n\'appartient pas à votre profil.' });
        setSaving(false);
        return;
      }
      let { error } = await supabase
        .from('portfolio_items')
        .update(fullPayload)
        .eq('id', editingItem.id);

      // Fallback if schema doesn't yet have context/objective/role/process/result columns
      if (error && (error.message?.includes('schema cache') || error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST204')) {
        const retry = await supabase
          .from('portfolio_items')
          .update(basePayload)
          .eq('id', editingItem.id);
        error = retry.error;
      }

      if (error) setSaveMsg({ type: 'error', text: error.message });
      else {
        setSaveMsg({ type: 'success', text: t.auth.signupSuccess });
        await loadData();
      }
    } else {
      let { error } = await supabase
        .from('portfolio_items')
        .insert({
          provider_id: targetProviderId,
          ...fullPayload,
        })
        .select();

      // Fallback if schema doesn't yet have context/objective/role/process/result columns
      if (error && (error.message?.includes('schema cache') || error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST204')) {
        const retry = await supabase
          .from('portfolio_items')
          .insert({
            provider_id: targetProviderId,
            ...basePayload,
          })
          .select();
        error = retry.error;
      }

      if (error) setSaveMsg({ type: 'error', text: error.message });
      else {
        setSaveMsg({ type: 'success', text: t.auth.signupSuccess });
        await loadData();
      }
    }
    setSaving(false);
    setShowItemForm(false);
    setEditingItem(null);
    setItemForm({
      title: '',
      description: '',
      photos: [],
      videos: [],
      video_thumbnails: [],
      tags: '',
      project_links: [],
      client_name: '',
      project_date: '',
      budget: '',
      location: '',
      featured: false,
      technologies_used: '',
      duration: '',
      team_size: '',
      context: '',
      objective: '',
      role: '',
      process: '',
      result: ''
    });
    setTimeout(() => setSaveMsg(null), 4000);
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('Starting video upload:', file.name, file.size);

    // Validate video duration (max 20 seconds)
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = async () => {
      console.log('Video duration:', video.duration);
      if (video.duration > 20) {
        setSaveMsg({ type: 'error', text: 'La vidéo ne doit pas dépasser 20 secondes.' });
        setTimeout(() => setSaveMsg(null), 4000);
        return;
      }

      setUploadingVideo(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).slice(2, 10)}.${fileExt}`;
        const filePath = `${user?.id}/portfolio-videos/${fileName}`;

        console.log('Uploading video to portfolio-demo-videos:', filePath);

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('portfolio-demo-videos')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        console.log('Upload successful:', uploadData);

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio-demo-videos')
          .getPublicUrl(filePath);

        console.log('Public URL:', publicUrl);

        setItemForm(prev => ({
          ...prev,
          videos: [...prev.videos.filter(v => v), publicUrl],
          video_thumbnails: [...prev.video_thumbnails.filter(t => t), ''] // Placeholder for thumbnail
        }));

        setSaveMsg({ type: 'success', text: 'Vidéo ajoutée avec succès.' });
        setTimeout(() => setSaveMsg(null), 4000);
      } catch (error) {
        console.error('Error uploading video:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        if (errorMessage.includes('Bucket not found') || errorMessage.includes('bucket')) {
          setSaveMsg({ type: 'error', text: 'Le bucket portfolio-demo-videos n\'existe pas. Veuillez le créer dans le dashboard Supabase.' });
        } else {
          setSaveMsg({ type: 'error', text: `Erreur lors du téléchargement de la vidéo: ${errorMessage}` });
        }
        setTimeout(() => setSaveMsg(null), 4000);
      } finally {
        setUploadingVideo(false);
      }
    };

    video.onerror = () => {
      console.error('Video load error');
      setSaveMsg({ type: 'error', text: 'Erreur lors du chargement de la vidéo.' });
      setTimeout(() => setSaveMsg(null), 4000);
      setUploadingVideo(false);
    };

    video.src = URL.createObjectURL(file);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadAvatar(file, user.id);
      setForm((prev) => ({ ...prev, avatar_url: publicUrl }));

      if (provider?.id) {
        await supabase
          .from('provider_profiles')
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', provider.id);
        setProvider((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));
      }
      // Also update profiles table
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      await refreshProfile();
      setSaveMsg({ type: 'success', text: 'Photo de profil (avatar) mise à jour avec succès.' });
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setSaveMsg({ type: 'error', text: err?.message || 'Erreur lors du téléversement de l\'avatar.' });
    } finally {
      setUploadingAvatar(false);
      if (avatarFileRef.current) avatarFileRef.current.value = '';
      setTimeout(() => setSaveMsg(null), 4000);
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingBanner(true);
    try {
      const publicUrl = await uploadBanner(file, user.id);
      setForm((prev) => ({ ...prev, banner_url: publicUrl }));

      if (provider?.id) {
        await supabase
          .from('provider_profiles')
          .update({ banner_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', provider.id);
        setProvider((prev) => (prev ? { ...prev, banner_url: publicUrl } : null));
      }
      setSaveMsg({ type: 'success', text: 'Photo de couverture (bannière) mise à jour avec succès.' });
    } catch (err: any) {
      console.error('Error uploading banner:', err);
      setSaveMsg({ type: 'error', text: err?.message || 'Erreur lors du téléversement de la bannière.' });
    } finally {
      setUploadingBanner(false);
      if (bannerFileRef.current) bannerFileRef.current.value = '';
      setTimeout(() => setSaveMsg(null), 4000);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !user) return;

    setUploadingPhotos(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const url = await uploadPortfolioPhoto(file, user.id);
        uploadedUrls.push(url);
      }

      setItemForm((prev) => ({
        ...prev,
        photos: [...prev.photos.filter((p) => p), ...uploadedUrls],
      }));
      setSaveMsg({ type: 'success', text: `${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} ajoutée${uploadedUrls.length > 1 ? 's' : ''} avec succès.` });
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      setSaveMsg({ type: 'error', text: error?.message || 'Erreur lors du téléchargement des photos.' });
      setTimeout(() => setSaveMsg(null), 4000);
    } finally {
      setUploadingPhotos(false);
    }
  }

  async function saveAvailabilitySchedule() {
    if (!provider) return;
    setSaving(true);
    setSaveMsg(null);

    const { error } = await supabase
      .from('provider_profiles')
      .update({
        availability_schedule: availabilitySchedule,
      })
      .eq('id', provider.id);

    if (error) {
      setSaveMsg({ type: 'error', text: error.message });
    } else {
      setSaveMsg({ type: 'success', text: t.auth.loginSuccess });
      await loadData();
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(null), 4000);
  }

  async function deletePortfolioItem(id: string) {
    if (!confirm('Supprimer cette réalisation ?')) return;
    await supabase.from('portfolio_items').delete().eq('id', id);
    await loadData();
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
          <h2 className="mt-4 text-xl font-bold text-neutral-900">{t.provider.createProfile}</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Pour commencer à recevoir des demandes, créez votre profil professionnel.
            Il sera soumis à validation par notre équipe.
          </p>
          <button onClick={createProfile} disabled={saving} className="btn-primary mt-6">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {t.provider.createProfile}
          </button>
        </div>
      </div>
    );
  }

  const statusInfo: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    pending: { label: t.provider.validationStatus.pending, icon: Clock, color: 'text-accent-600 bg-accent-50' },
    approved: { label: t.provider.validationStatus.approved, icon: CheckCircle2, color: 'text-success-600 bg-success-50' },
    rejected: { label: t.provider.validationStatus.rejected, icon: XCircle, color: 'text-error-600 bg-error-50' },
    changes_requested: { label: t.provider.validationStatus.changesRequested, icon: AlertCircle, color: 'text-warning-600 bg-warning-50' },
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
    { id: 'availability', label: 'Disponibilité', icon: Calendar },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8">
      {/* Hidden file inputs for avatar & banner upload */}
      <input
        type="file"
        ref={avatarFileRef}
        onChange={handleAvatarUpload}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerFileRef}
        onChange={handleBannerUpload}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Espace prestataire</h1>
          <p className="mt-1 text-sm text-neutral-600">{provider.business_name}</p>
        </div>
        <span className={`badge ${si.color} w-fit`}>
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
              className={`flex items-center gap-1.5 sm:gap-2 whitespace-nowrap px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                tab === t.id ? 'border-b-2 border-primary-600 text-primary-600' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Icon size={14} className="sm:hidden" />
              <Icon size={16} className="hidden sm:block" />
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
              <div className="relative group">
                {provider.avatar_url ? (
                  <img src={provider.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover shadow-sm" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-xl font-bold text-primary-700">
                    {provider.business_name[0]?.toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1.5 -right-1.5 rounded-full bg-primary-600 p-1.5 text-white shadow-md hover:bg-primary-700 transition"
                  title="Changer l'avatar"
                >
                  {uploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                </button>
              </div>
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
                setItemForm({ 
                  title: '', 
                  description: '', 
                  photos: [], 
                  videos: [],
                  video_thumbnails: [],
                  tags: '',
                  project_links: [],
                  client_name: '',
                  project_date: '',
                  budget: '',
                  location: '',
                  featured: false,
                  technologies_used: '',
                  duration: '',
                  team_size: '',
                  context: '',
                  objective: '',
                  role: '',
                  process: '',
                  result: ''
                });
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
                  <label className="label">Photos du projet</label>
                  <div className="mb-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhotos}
                      className="input-field"
                    />
                    <p className="mt-1 text-xs text-neutral-500">Sélectionnez une ou plusieurs images depuis votre ordinateur.</p>
                  </div>
                  {itemForm.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {itemForm.photos.map((photo, i) => (
                        <div key={photo + i} className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
                          <img src={photo} alt={`Portfolio ${i + 1}`} className="h-28 w-full object-cover" />
                          <button
                            onClick={() => setItemForm({ ...itemForm, photos: itemForm.photos.filter((_, j) => j !== i) })}
                            className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-neutral-700 shadow-sm transition hover:bg-white"
                            type="button"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Vidéos (max 20 secondes chacune)</label>
                  <div className="mb-3">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                      className="input-field"
                    />
                    <p className="mt-1 text-xs text-neutral-500">Formats acceptés: MP4, WebM. Durée maximale: 20 secondes.</p>
                  </div>
                  {itemForm.videos.filter(v => v).length > 0 && (
                    <div className="space-y-2">
                      {itemForm.videos.filter(v => v).map((video, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                          <video
                            src={video}
                            className="h-16 w-24 object-cover rounded"
                            controls
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-600 truncate">{video}</p>
                          </div>
                          <button
                            onClick={() => {
                              const videos = itemForm.videos.filter((_, j) => j !== i);
                              const thumbnails = itemForm.video_thumbnails.filter((_, j) => j !== i);
                              setItemForm({ ...itemForm, videos, video_thumbnails: thumbnails });
                            }}
                            className="btn-ghost text-error-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                <div>
                  <label className="label">Liens du projet (ex: Démo, Repo)</label>
                  <div className="space-y-2">
                    {(itemForm.project_links as { label: string; url: string; type?: string }[]).map((link, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2">
                        <select
                          value={link.type || 'other'}
                          onChange={(e) => {
                            const links = [...(itemForm.project_links as any[])];
                            links[idx] = { ...links[idx], type: e.target.value };
                            setItemForm({ ...itemForm, project_links: links });
                          }}
                          className="col-span-2 input-field"
                        >
                          <option value="demo">Démo</option>
                          <option value="repo">Repo</option>
                          <option value="case-study">Cas d'étude</option>
                          <option value="other">Autre</option>
                        </select>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => {
                            const links = [...(itemForm.project_links as any[])];
                            links[idx] = { ...links[idx], label: e.target.value };
                            setItemForm({ ...itemForm, project_links: links });
                          }}
                          className="col-span-4 input-field"
                          placeholder="Label (ex: Démo)"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => {
                            const links = [...(itemForm.project_links as any[])];
                            links[idx] = { ...links[idx], url: e.target.value };
                            setItemForm({ ...itemForm, project_links: links });
                          }}
                          className="col-span-5 input-field"
                          placeholder="https://..."
                        />
                        <button
                          type="button"
                          onClick={() => setItemForm({ ...itemForm, project_links: (itemForm.project_links as any[]).filter((_, j) => j !== idx) })}
                          className="col-span-1 btn-ghost text-error-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div>
                      <button
                        type="button"
                        onClick={() => setItemForm({ ...itemForm, project_links: [ ...(itemForm.project_links as any[]), { label: '', url: '' } ] })}
                        className="btn-secondary"
                      >
                        <Plus size={14} /> Ajouter un lien
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Nom du client</label>
                    <input
                      type="text"
                      value={itemForm.client_name}
                      onChange={(e) => setItemForm({ ...itemForm, client_name: e.target.value })}
                      className="input-field"
                      placeholder="Nom de l'entreprise ou du client"
                    />
                  </div>
                  <div>
                    <label className="label">Date du projet</label>
                    <input
                      type="date"
                      value={itemForm.project_date}
                      onChange={(e) => setItemForm({ ...itemForm, project_date: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Budget</label>
                    <input
                      type="text"
                      value={itemForm.budget}
                      onChange={(e) => setItemForm({ ...itemForm, budget: e.target.value })}
                      className="input-field"
                      placeholder="Ex: 500-1000€"
                    />
                  </div>
                  <div>
                    <label className="label">Lieu du projet</label>
                    <input
                      type="text"
                      value={itemForm.location}
                      onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                      className="input-field"
                      placeholder="Ex: Paris, France"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Technologies utilisées (séparées par des virgules)</label>
                  <input
                    type="text"
                    value={itemForm.technologies_used}
                    onChange={(e) => setItemForm({ ...itemForm, technologies_used: e.target.value })}
                    className="input-field"
                    placeholder="React, Node.js, PostgreSQL"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Durée du projet</label>
                    <input
                      type="text"
                      value={itemForm.duration}
                      onChange={(e) => setItemForm({ ...itemForm, duration: e.target.value })}
                      className="input-field"
                      placeholder="Ex: 2 semaines, 1 mois"
                    />
                  </div>
                  <div>
                    <label className="label">Taille de l'équipe</label>
                    <input
                      type="number"
                      value={itemForm.team_size}
                      onChange={(e) => setItemForm({ ...itemForm, team_size: e.target.value })}
                      className="input-field"
                      placeholder="Nombre de personnes"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.featured}
                      onChange={(e) => setItemForm({ ...itemForm, featured: e.target.checked })}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">Mettre en avant cette réalisation</span>
                  </label>
                </div>

                {/* ===== PROFESSIONAL PORTFOLIO ELEMENTS ===== */}
                <div className="border-t-2 border-primary-200 pt-6 mt-6">
                  <h5 className="text-sm font-bold text-primary-700 mb-4 uppercase tracking-wider">
                    📋 Éléments professionnel du portfolio
                  </h5>
                  <p className="text-xs text-neutral-500 mb-4">
                    Complétez ces informations pour créer un portfolio 100% professionnel qui impressionnera vos clients.
                  </p>

                  <div>
                    <label className="label">
                      🎯 Contexte & Problématique
                      <span className="text-xs font-normal text-neutral-500 ml-2">(Brief, contraintes)</span>
                    </label>
                    <textarea
                      value={itemForm.context}
                      onChange={(e) => setItemForm({ ...itemForm, context: e.target.value })}
                      className="input-field resize-none"
                      rows={3}
                      placeholder="Décrivez la problématique, le brief et les contraintes du projet..."
                    />
                  </div>

                  <div>
                    <label className="label">
                      🎯 Objectif
                      <span className="text-xs font-normal text-neutral-500 ml-2">(Ce qu'il fallait accomplir)</span>
                    </label>
                    <textarea
                      value={itemForm.objective}
                      onChange={(e) => setItemForm({ ...itemForm, objective: e.target.value })}
                      className="input-field resize-none"
                      rows={2}
                      placeholder="Quel était l'objectif principal du projet ?"
                    />
                  </div>

                  <div>
                    <label className="label">
                      👤 Rôle & Contribution
                      <span className="text-xs font-normal text-neutral-500 ml-2">(Votre contribution exacte)</span>
                    </label>
                    <textarea
                      value={itemForm.role}
                      onChange={(e) => setItemForm({ ...itemForm, role: e.target.value })}
                      className="input-field resize-none"
                      rows={2}
                      placeholder="Décrivez votre rôle : seul(e), en équipe, responsable de quels aspects ?"
                    />
                  </div>

                  <div>
                    <label className="label">
                      ⚙️ Processus & Méthodologie
                      <span className="text-xs font-normal text-neutral-500 ml-2">(Outils, étapes, approche)</span>
                    </label>
                    <textarea
                      value={itemForm.process}
                      onChange={(e) => setItemForm({ ...itemForm, process: e.target.value })}
                      className="input-field resize-none"
                      rows={3}
                      placeholder="Méthodologie utilisée, outils, étapes clés et approche du projet..."
                    />
                  </div>

                  <div>
                    <label className="label">
                      ✓ Résultat & Impact
                      <span className="text-xs font-normal text-neutral-500 ml-2">(Livrable, chiffres, KPIs)</span>
                    </label>
                    <textarea
                      value={itemForm.result}
                      onChange={(e) => setItemForm({ ...itemForm, result: e.target.value })}
                      className="input-field resize-none"
                      rows={3}
                      placeholder="Livrable final, résultats mesurables, impact, retours clients, KPIs..."
                    />
                  </div>
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
                    {item.project_links && item.project_links.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {(item.project_links as { label: string; url: string; type?: string }[]).map((l, i) => {
                          const type = (l.type || 'other') as string;
                          const Icon = type === 'demo' ? Play : type === 'repo' ? Code : type === 'case-study' ? FileText : ExternalLink;
                          return l.url ? (
                            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md bg-neutral-50 px-2 py-1 text-xs text-primary-600 hover:underline">
                              <Icon size={14} />
                              <span>{l.label || l.url}</span>
                            </a>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setItemForm({
                            title: item.title,
                            description: item.description ?? '',
                            photos: item.photos?.length ? item.photos : [''],
                            videos: item.videos?.length ? item.videos : [''],
                            video_thumbnails: item.video_thumbnails?.length ? item.video_thumbnails : [''],
                            tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
                            project_links: item.project_links?.length ? item.project_links : [],
                            client_name: item.client_name ?? '',
                            project_date: item.project_date ?? '',
                            budget: item.budget ?? '',
                            location: item.location ?? '',
                            featured: item.featured ?? false,
                            technologies_used: Array.isArray(item.technologies_used) ? item.technologies_used.join(', ') : '',
                            duration: item.duration ?? '',
                            team_size: item.team_size?.toString() ?? '',
                            // ===== PROFESSIONAL PORTFOLIO FIELDS =====
                            context: item.context ?? '',
                            objective: item.objective ?? '',
                            role: item.role ?? '',
                            process: item.process ?? '',
                            result: item.result ?? ''
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

      {/* Availability management */}
      {tab === 'availability' && (
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-900">Horaires de disponibilité</h3>
            <p className="mt-1 text-sm text-neutral-500">Définissez vos horaires de travail pour chaque jour de la semaine</p>
            
            <div className="mt-6 space-y-4">
              {Object.entries(availabilitySchedule).map(([day, schedule]) => (
                <div key={day} className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4">
                  <div className="flex-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schedule.available}
                        onChange={(e) => setAvailabilitySchedule({
                          ...availabilitySchedule,
                          [day]: { ...schedule, available: e.target.checked }
                        })}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-medium text-neutral-900 capitalize">{day}</span>
                    </label>
                  </div>
                  {schedule.available && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={schedule.start}
                        onChange={(e) => setAvailabilitySchedule({
                          ...availabilitySchedule,
                          [day]: { ...schedule, start: e.target.value }
                        })}
                        className="input-field w-32"
                      />
                      <span className="text-neutral-500">-</span>
                      <input
                        type="time"
                        value={schedule.end}
                        onChange={(e) => setAvailabilitySchedule({
                          ...availabilitySchedule,
                          [day]: { ...schedule, end: e.target.value }
                        })}
                        className="input-field w-32"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={saveAvailabilitySchedule}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Enregistrer les horaires
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-900">Statut actuel</h3>
            <div className="mt-4">
              <label className="label">Disponibilité générale</label>
              <select
                value={form.availability as string ?? 'available'}
                onChange={(e) => setForm({ ...form, availability: e.target.value })}
                className="input-field"
              >
                <option value="available">Disponible pour de nouvelles missions</option>
                <option value="busy">Sur mission</option>
                <option value="unavailable">Indisponible temporairement</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Mettre à jour le statut
              </button>
            </div>
          </div>
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
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">Photos de profil et couverture</h3>
            <p className="text-sm text-neutral-500 mb-6">Ajoutez ou modifiez votre avatar et votre bannière pour valoriser votre profil auprès des clients.</p>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Avatar Upload */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
                <label className="text-sm font-semibold text-neutral-800 mb-2 block">Photo de profil (Avatar)</label>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative h-20 w-20 rounded-2xl border-2 border-white bg-neutral-200 shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {(form.avatar_url as string) ? (
                      <img src={form.avatar_url as string} alt="Avatar" className="h-full w-full object-cover" />
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
                      onClick={() => avatarFileRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="btn-secondary w-full justify-center text-xs py-2"
                    >
                      {uploadingAvatar ? (
                        <><Loader2 size={14} className="animate-spin" /> Téléversement...</>
                      ) : (
                        <><Upload size={14} /> Choisir une photo</>
                      )}
                    </button>
                    {(form.avatar_url as string) && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, avatar_url: '' })}
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
                    value={form.avatar_url as string ?? ''}
                    onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                    className="input-field text-xs"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Banner Upload */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
                <label className="text-sm font-semibold text-neutral-800 mb-2 block">Bannière de couverture</label>
                <div className="relative h-24 w-full rounded-xl border border-neutral-200 bg-neutral-200 overflow-hidden mb-3 flex items-center justify-center">
                  {(form.banner_url as string) ? (
                    <img src={form.banner_url as string} alt="Bannière" className="h-full w-full object-cover" />
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
                    onClick={() => bannerFileRef.current?.click()}
                    disabled={uploadingBanner}
                    className="btn-secondary flex-1 justify-center text-xs py-2"
                  >
                    {uploadingBanner ? (
                      <><Loader2 size={14} className="animate-spin" /> Téléversement...</>
                    ) : (
                      <><Upload size={14} /> Choisir une bannière</>
                    )}
                  </button>
                  {(form.banner_url as string) && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, banner_url: '' })}
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
                    value={form.banner_url as string ?? ''}
                    onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                    className="input-field text-xs"
                    placeholder="https://..."
                  />
                </div>
              </div>
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
    </div>
  );
}
