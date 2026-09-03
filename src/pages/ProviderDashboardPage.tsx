import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, MessageSquare, BarChart3, Settings,
  Loader2, Plus, Trash2, Edit3, Save, X, Eye, EyeOff, AlertCircle,
  CheckCircle2, Clock, XCircle, Upload, Star, TrendingUp, Users, MessageCircle, Globe, CreditCard, Calendar, MapPin,
  Play, Code, FileText, ExternalLink, Camera, Image as ImageIcon, BadgeCheck, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { uploadAvatar, uploadBanner, uploadPortfolioPhoto, uploadContractPdf } from '@/lib/storage';
import { sendEmail, generateBookingConfirmationEmail, generateBookingRequestEmail } from '@/lib/email';
import type { ProviderProfile, PortfolioItem, Category, Review } from '@/types';
import { slugify, formatDate } from '@/lib/utils';
import StarRating from '@/components/StarRating';
import { BentoGrid, BentoCard } from '@/components/BentoGrid';
import { BentoStatCard, BentoFeatureCard } from '@/components/BentoCard';
import { countries } from '@/data/countries';
import { currencies } from '@/data/currencies';

type Tab = 'overview' | 'portfolio' | 'profile' | 'reviews' | 'availability' | 'bookings' | 'invoices';

export default function ProviderDashboardPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free' | 'basic' | 'pro' | 'enterprise'>('free');
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

  // Invoice form state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    client_name: '',
    client_email: '',
    client_address: '',
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [] as { description: string; quantity: number; unit_price: number }[],
    tax_rate: 20,
    notes: '',
    currency: 'EUR'
  });
  // Availability slots management
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotForm, setSlotForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    is_available: true,
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
    if (provider) {
      loadAvailabilitySlots();
    }
  }, [provider]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);

    const [provRes, catRes] = await Promise.all([
      supabase.from('provider_profiles').select('id, user_id, business_name, slug, headline, description, avatar_url, banner_url, city, country, service_area, remote_service, phone, website, price_range, currency, availability, skills, languages, experience_years, certifications, category_id, validation_status, is_featured, availability_schedule, category:categories(id, name, slug)').eq('user_id', user.id).order('rating_count', { ascending: false }).order('created_at', { ascending: true }).limit(1).maybeSingle(),
      supabase.from('categories').select('id, name, slug, icon, parent_id, sort_order').order('sort_order'),
    ]);

    const providerId = provRes.data?.id;

    if (provRes.data) {
      setProvider(provRes.data as unknown as ProviderProfile);
      setForm({
        business_name: provRes.data.business_name ?? '',
        headline: provRes.data.headline ?? '',
        description: provRes.data.description ?? '',
        category_id: provRes.data.category_id ?? '',
        skills: provRes.data.skills ?? [],
        experience_years: provRes.data.experience_years ?? '',
        languages: provRes.data.languages ?? [],
        certifications: provRes.data.certifications ?? '',
        city: provRes.data.city ?? '',
        country: provRes.data.country ?? '',
        service_area: provRes.data.service_area ?? '',
        remote_service: provRes.data.remote_service,
        phone: provRes.data.phone ?? '',
        website: provRes.data.website ?? '',
        price_range: provRes.data.price_range ?? '',
        currency: (provRes.data as any).currency ?? 'EUR',
        availability: provRes.data.availability,
        avatar_url: provRes.data.avatar_url ?? '',
        banner_url: provRes.data.banner_url ?? '',
      });
      setSkillsInput((provRes.data.skills ?? []).join(', '));
      setLanguagesInput((provRes.data.languages ?? []).join(', '));
      if ((provRes.data as any).availability_schedule) {
        setAvailabilitySchedule((provRes.data as any).availability_schedule);
      }
    }

    const [portRes, revRes, bookingRes, invoiceRes, subscriptionRes] = providerId
      ? await Promise.all([
          supabase.from('portfolio_items').select('id, provider_id, title, description, photos, videos, video_thumbnails, tags, project_links, client_name, project_date, budget, location, featured, technologies_used, duration, team_size, context, objective, role, process, result, sort_order, created_at').eq('provider_id', providerId).order('sort_order'),
          supabase.from('reviews').select('id, provider_id, author_id, rating, comment, created_at, provider_response, provider_response_at').eq('provider_id', providerId).order('created_at', { ascending: false }),
          supabase.from('bookings').select('id, client_id, provider_id, scheduled_at, status, service_type, duration_minutes, location_type, location_address, notes, price, currency, payment_method, payment_status, created_at, client:profiles(id, full_name, email, avatar_url)').eq('provider_id', providerId).order('scheduled_at', { ascending: true }),
          supabase.from('invoices').select('id, booking_id, client_id, provider_id, invoice_number, amount, currency, status, due_date, paid_date, created_at').eq('provider_id', providerId).order('created_at', { ascending: false }),
          supabase.from('subscriptions').select('plan').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ])
      : [
          { data: [] },
          { data: null },
          { data: [] },
          { data: [] },
          { data: [] },
        ];

    setCategories(catRes.data as Category[] ?? []);
    setPortfolio(portRes.data as PortfolioItem[] ?? []);
    setReviews(revRes.data as Review[] ?? []);
    setBookings(bookingRes.data as any[] ?? []);
    setInvoices(invoiceRes.data as any[] ?? []);
    setSubscriptionPlan((subscriptionRes.data?.plan as typeof subscriptionPlan) ?? 'free');
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
        business_name: profile.full_name ?? 'Votre entreprise',
        slug,
        headline: 'Votre activité / expertise',
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
    console.log('=== savePortfolioItem called ===');
    console.log('Current provider:', provider);
    console.log('Current user:', user);
    console.log('Editing item:', editingItem);
    console.log('Item form:', itemForm);
    
    let targetProviderId = provider?.id;
    if (!targetProviderId && user) {
      console.log('No provider_id found, searching for existing provider profile...');
      // Try to find existing provider profile
      const { data: existingProvider, error: findError } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', user.id)
        .order('rating_count', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (findError) {
        console.error('Error finding provider profile:', findError);
        setSaveMsg({ type: 'error', text: `Erreur lors de la recherche du profil: ${findError.message}` });
        return;
      }

      if (existingProvider) {
        console.log('Found existing provider:', existingProvider);
        targetProviderId = existingProvider.id;
      } else {
        console.log('No existing provider, creating new one...');
        // Create a new provider profile
        const slug = slugify((profile as any)?.full_name || 'prestataire') + '-' + Date.now().toString().slice(-4);
        const { data: newProvider, error: newProviderError } = await supabase
          .from('provider_profiles')
          .insert({
            user_id: user.id,
            business_name: (profile as any)?.full_name || 'Votre entreprise',
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

        console.log('Created new provider:', newProvider);
        targetProviderId = newProvider.id;
      }
    }

    if (!targetProviderId) {
      console.error('No targetProviderId found');
      setSaveMsg({ type: 'error', text: 'Aucun profil prestataire trouvé. Veuillez créer votre profil prestataire d\'abord.' });
      return;
    }

    console.log('Using targetProviderId:', targetProviderId);

    if (!editingItem && subscriptionPlan === 'free' && portfolio.length >= 5) {
      console.log('Free plan limit reached');
      setSaveMsg({ type: 'error', text: 'Le plan Gratuit est limité à 5 réalisations. Passez à un plan supérieur pour continuer.' });
      return;
    }

    if (!itemForm.title.trim()) {
      console.log('Title is empty');
      setSaveMsg({ type: 'error', text: 'Le titre de la réalisation est obligatoire.' });
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
         
        new URL(l.url);
      } catch (e) {
        console.error('Invalid URL:', l.url);
        setSaveMsg({ type: 'error', text: `URL invalide : ${l.url}` });
        return;
      }
    }

    console.log('Prepared data:', { photos, videos, videoThumbnails, tags, technologiesUsed, projectLinks });
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

    console.log('Payload to save:', fullPayload);

    if (editingItem) {
      console.log('Updating existing item:', editingItem.id);
      // Prevent updating items that don't belong to this user's provider
      if (editingItem.provider_id !== targetProviderId) {
        console.error('Item does not belong to provider');
        setSaveMsg({ type: 'error', text: 'Impossible de modifier : cette réalisation n\'appartient pas à votre profil.' });
        setSaving(false);
        return;
      }
      let { error } = await supabase
        .from('portfolio_items')
        .update(fullPayload)
        .eq('id', editingItem.id);

      console.log('Update result:', error || 'Success');

      // Fallback if schema doesn't yet have context/objective/role/process/result columns
      if (error && (error.message?.includes('schema cache') || error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST204')) {
        console.log('Fallback to base payload due to schema error');
        const retry = await supabase
          .from('portfolio_items')
          .update(basePayload)
          .eq('id', editingItem.id);
        error = retry.error;
        console.log('Retry result:', error || 'Success');
      }

      if (error) {
        console.error('Final error:', error);
        setSaveMsg({ type: 'error', text: error.message });
      } else {
        setSaveMsg({ type: 'success', text: 'Réalisation mise à jour avec succès' });
        await loadData();
      }
    } else {
      console.log('Creating new item');
      let { error } = await supabase
        .from('portfolio_items')
        .insert({
          provider_id: targetProviderId,
          ...fullPayload,
        })
        .select();

      console.log('Insert result:', error || 'Success');

      // Fallback if schema doesn't yet have context/objective/role/process/result columns
      if (error && (error.message?.includes('schema cache') || error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST204')) {
        console.log('Fallback to base payload due to schema error');
        const retry = await supabase
          .from('portfolio_items')
          .insert({
            provider_id: targetProviderId,
            ...basePayload,
          })
          .select();
        error = retry.error;
        console.log('Retry result:', error || 'Success');
      }

      if (error) {
        console.error('Final error:', error);
        setSaveMsg({ type: 'error', text: error.message });
      } else {
        setSaveMsg({ type: 'success', text: 'Réalisation créée avec succès' });
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
      setSaveMsg({ type: 'success', text: 'Horaires enregistrés avec succès' });
      await loadData();
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(null), 4000);
  }

  async function loadAvailabilitySlots() {
    if (!provider) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('availability_slots')
      .select('id, provider_id, date, start_time, end_time, is_available')
      .eq('provider_id', provider.id)
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (data) {
      setAvailabilitySlots(data);
    }
  }

  async function createAvailabilitySlot() {
    if (!provider || !slotForm.date || !slotForm.start_time || !slotForm.end_time) return;
    setSaving(true);

    const { error } = await supabase
      .from('availability_slots')
      .insert({
        provider_id: provider.id,
        date: slotForm.date,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        is_available: slotForm.is_available,
      });

    if (!error) {
      setSlotForm({ date: '', start_time: '', end_time: '', is_available: true });
      setShowSlotForm(false);
      await loadAvailabilitySlots();
    }
    setSaving(false);
  }

  async function deleteAvailabilitySlot(slotId: string) {
    if (!confirm('Supprimer ce créneau ?')) return;
    await supabase.from('availability_slots').delete().eq('id', slotId);
    await loadAvailabilitySlots();
  }

  async function finalizeSignedContract(booking: any, contractDocumentUrl?: string) {
    const currentMetadata = booking.metadata || {};
    const paymentData = currentMetadata.payment_data || {};
    const contractReference = currentMetadata.contract_reference || `CTR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const signedAt = new Date().toISOString();

    const nextMetadata = {
      ...currentMetadata,
      contract_reference: contractReference,
      contract_status: 'signed',
      contract_signed_at: signedAt,
      contract_document_url: contractDocumentUrl || currentMetadata.contract_document_url || null,
      payment_data: {
        ...paymentData,
        method: booking.payment_method || paymentData.method || 'manual',
        amount: booking.price || paymentData.amount || 0,
        currency: booking.currency || paymentData.currency || 'EUR',
        status: booking.payment_status || paymentData.status || 'pending',
        provider: currentMetadata.payment_provider || 'manual',
        provider_payment_id: currentMetadata.provider_payment_id || currentMetadata.payment_intent_reference || null,
      },
    };

    await supabase
      .from('bookings')
      .update({ metadata: nextMetadata })
      .eq('id', booking.id);

    return {
      contract_reference: contractReference,
      signed_at: signedAt,
      contract_document_url: contractDocumentUrl || currentMetadata.contract_document_url || null,
    };
  }

  async function downloadMissionContract(booking: any) {
    const { jsPDF } = await import('jspdf');
    const metadata = booking.metadata || {};
    const paymentData = metadata.payment_data || {};
    const contractReference = metadata.contract_reference || `CTR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('SERVIO - Contrat de mission', 14, 20);
    doc.setFontSize(11);
    doc.text(`Référence contrat: ${contractReference}`, 14, 32);
    doc.text(`Client: ${booking.client?.full_name || 'Client'}`, 14, 40);
    doc.text(`Prestataire: ${provider?.business_name || 'Prestataire'}`, 14, 48);
    doc.text(`Service: ${booking.service_type || 'Consultation'}`, 14, 56);
    doc.text(`Date: ${new Date(booking.scheduled_at).toLocaleString('fr-FR')}`, 14, 64);
    doc.text(`Montant: ${booking.price || 0} ${booking.currency || 'EUR'}`, 14, 72);
    doc.text(`Mode de paiement: ${booking.payment_method || paymentData.method || 'non défini'}`, 14, 80);
    doc.text(`Prestataire de paiement: ${metadata.payment_provider || paymentData.provider || 'non défini'}`, 14, 88);
    doc.text(`Référence paiement: ${metadata.payment_intent_reference || metadata.provider_payment_id || paymentData.provider_payment_id || 'non disponible'}`, 14, 96);
    doc.text(`Escrow: ${booking.payment_status === 'held' || booking.payment_status === 'completed' ? 'Paiement sécurisé et retenu' : 'Statut standard'}`, 14, 104);
    doc.text('Conditions: La mission est validée après acceptation du devis et validation du prestataire.', 14, 120, { maxWidth: 180 });
    doc.text('Signature prestataire: ______________________________', 14, 150);
    doc.text('Signature client: ______________________________', 14, 160);

    const pdfBlob = doc.output('blob');
    const contractUrl = await uploadContractPdf(pdfBlob, booking.id, provider?.id || booking.provider_id);
    await finalizeSignedContract(booking, contractUrl);
    doc.save(`contrat-mission-${contractReference.toLowerCase()}.pdf`);
  }

  async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'rejected' | 'completed' | 'cancelled') {
    setSaving(true);

    const booking = bookings.find(b => b.id === bookingId);

    if (status === 'completed' && booking) {
      try {
        const response = await fetch('/api/contract-finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            providerId: provider?.id,
            userId: user?.id,
            paymentMethod: booking.payment_method,
            amount: booking.price,
            currency: booking.currency || 'EUR',
            contractReference: booking.metadata?.contract_reference || undefined,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Validation finale refusée');
        }
      } catch (finalizeError) {
        console.error('Backend final validation failed:', finalizeError);
        setSaveMsg({ type: 'error', text: finalizeError instanceof Error ? finalizeError.message : 'Validation finale refusée' });
        setSaving(false);
        return;
      }
    }

    const nextPaymentStatus = status === 'completed' ? 'completed' : status === 'cancelled' ? 'refunded' : status === 'rejected' ? 'failed' : 'held';
    const { error } = await supabase
      .from('bookings')
      .update({ status, payment_status: nextPaymentStatus })
      .eq('id', bookingId);

    if (!error) {
      // Send notification to client
      if (booking) {
        const statusMessages = {
          confirmed: 'Votre réservation a été confirmée',
          rejected: 'Votre réservation a été refusée',
          completed: 'Votre réservation est terminée',
          cancelled: 'Votre réservation a été annulée',
        };
        await supabase.from('notifications').insert({
          user_id: booking.client_id,
          type: 'booking',
          title: `Réservation ${status === 'confirmed' ? 'confirmée' : status === 'rejected' ? 'refusée' : status === 'completed' ? 'terminée' : 'annulée'}`,
          body: statusMessages[status],
          link: '/bookings',
        });

        // Send email notification for confirmed bookings
        if (status === 'confirmed' && booking.client?.email) {
          const date = new Date(booking.scheduled_at).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          });
          const time = new Date(booking.scheduled_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          
          const emailOptions = generateBookingConfirmationEmail(
            provider?.business_name || 'Prestataire',
            booking.client.full_name || 'Client',
            date,
            time,
            booking.service_type || 'Service'
          );
          emailOptions.to = booking.client.email;
          await sendEmail(emailOptions);
        }

        // Finalize signed contract and invoice when booking is completed
        if (status === 'completed' && booking.price) {
          await finalizeSignedContract(booking);
          await generateInvoice(booking);
        }
      }
      await loadData();
    }
    setSaving(false);
  }

  async function generateInvoice(booking: any) {
    const invoiceNumber = `INV-${Date.now()}-${booking.id.slice(0, 8)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    const { error } = await supabase.from('invoices').insert({
      booking_id: booking.id,
      client_id: booking.client_id,
      provider_id: booking.provider_id,
      invoice_number: invoiceNumber,
      amount: booking.price,
      currency: booking.currency || 'EUR',
      status: 'sent',
      due_date: dueDate.toISOString(),
    });

    if (error) {
      console.error('Error generating invoice:', error);
    }
  }

  async function markInvoiceAsPaid(invoiceId: string) {
    setSaving(true);
    const { error } = await supabase
      .from('invoices')
      .update({ 
        status: 'paid',
        paid_date: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (!error) {
      await loadData();
    }
    setSaving(false);
  }

  async function createInvoice() {
    if (!provider) {
      setSaveMsg({ type: 'error', text: 'Aucun profil prestataire trouvé' });
      return;
    }

    // Calculate totals
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = subtotal * (invoiceForm.tax_rate / 100);
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number if not provided
    const invoiceNumber = invoiceForm.invoice_number || `INV-${Date.now()}`;

    setSaving(true);
    setSaveMsg(null);

    const { error } = await supabase.from('invoices').insert({
      invoice_number: invoiceNumber,
      client_id: null, // Will be linked to client if exists
      provider_id: provider.id,
      type: 'custom',
      status: 'draft',
      amount: totalAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      currency: invoiceForm.currency,
      due_date: invoiceForm.due_date,
      notes: invoiceForm.notes,
      // Store items as JSON in notes or create a separate table
      metadata: {
        client_name: invoiceForm.client_name,
        client_email: invoiceForm.client_email,
        client_address: invoiceForm.client_address,
        issue_date: invoiceForm.issue_date,
        items: invoiceForm.items,
        tax_rate: invoiceForm.tax_rate
      }
    });

    if (error) {
      setSaveMsg({ type: 'error', text: error.message });
    } else {
      setSaveMsg({ type: 'success', text: 'Facture créée avec succès' });
      await loadData();
      setShowInvoiceForm(false);
      resetInvoiceForm();
    }
    setSaving(false);
  }

  async function updateInvoice(invoiceId: string) {
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = subtotal * (invoiceForm.tax_rate / 100);
    const totalAmount = subtotal + taxAmount;

    setSaving(true);
    setSaveMsg(null);

    const { error } = await supabase
      .from('invoices')
      .update({
        invoice_number: invoiceForm.invoice_number,
        amount: totalAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        currency: invoiceForm.currency,
        due_date: invoiceForm.due_date,
        notes: invoiceForm.notes,
        metadata: {
          client_name: invoiceForm.client_name,
          client_email: invoiceForm.client_email,
          client_address: invoiceForm.client_address,
          issue_date: invoiceForm.issue_date,
          items: invoiceForm.items,
          tax_rate: invoiceForm.tax_rate
        }
      })
      .eq('id', invoiceId);

    if (error) {
      setSaveMsg({ type: 'error', text: error.message });
    } else {
      setSaveMsg({ type: 'success', text: 'Facture mise à jour avec succès' });
      await loadData();
      setShowInvoiceForm(false);
      resetInvoiceForm();
      setEditingInvoice(null);
    }
    setSaving(false);
  }

  async function deleteInvoice(invoiceId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;
    
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
    if (!error) {
      await loadData();
    }
  }

  async function sendInvoice(invoiceId: string) {
    setSaving(true);
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoiceId);

    if (!error) {
      setSaveMsg({ type: 'success', text: 'Facture envoyée au client' });
      await loadData();
    } else {
      setSaveMsg({ type: 'error', text: error.message });
    }
    setSaving(false);
  }

  function resetInvoiceForm() {
    setInvoiceForm({
      client_name: '',
      client_email: '',
      client_address: '',
      invoice_number: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [],
      tax_rate: 20,
      notes: '',
      currency: 'EUR'
    });
  }

  function addInvoiceItem() {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: 1, unit_price: 0 }]
    });
  }

  function updateInvoiceItem(index: number, field: string, value: any) {
    const newItems = [...invoiceForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceForm({ ...invoiceForm, items: newItems });
  }

  function removeInvoiceItem(index: number) {
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((_, i) => i !== index)
    });
  }

  function calculateInvoiceTotal() {
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = subtotal * (invoiceForm.tax_rate / 100);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
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
  const validationDetailText =
    provider.validation_status === 'approved'
      ? 'Profil validé : identité, présentation et compétence vérifiées.'
      : provider.validation_status === 'changes_requested'
      ? 'Modifications demandées : complétez les informations manquantes pour accélérer la validation.'
      : provider.validation_status === 'rejected'
      ? 'Validation refusée : vérifiez les informations et corrigez les éléments signalés.'
      : 'Validation en cours : délai indicatif 24 à 48h pour la vérification du profil et des informations.';

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
    { id: 'bookings', label: 'Réservations', icon: MessageCircle },
    { id: 'invoices', label: 'Factures', icon: CreditCard },
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

      <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50 p-4">
        <div className="flex items-center gap-2">
          <BadgeCheck size={18} className="text-primary-600" />
          <p className="text-sm font-semibold text-neutral-900">Statut de validation</p>
        </div>
        <p className="mt-2 text-sm text-neutral-700">{validationDetailText}</p>
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
            value={Number(provider.rating_avg ?? 0).toFixed(1)} 
            label={`${provider.rating_count} avis`}
            variant="primary"
          />
          <BentoStatCard 
            icon={FolderOpen} 
            value={portfolio.length} 
            label="Réalisations" 
            variant="default"
          />
          <BentoStatCard 
            icon={MessageCircle} 
            value={bookings.filter(b => b.status === 'pending').length} 
            label="Réservations en attente" 
            variant="default"
          />
          <BentoStatCard 
            icon={CheckCircle2} 
            value={bookings.filter(b => b.status === 'completed').length} 
            label="Réservations complétées" 
            variant="primary"
          />
          <BentoStatCard 
            icon={CreditCard} 
            value={`${invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)}€`} 
            label="Revenus totaux" 
            variant="primary"
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

          <BentoCard colSpan={2} className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Statistiques des réservations</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Taux de confirmation</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {bookings.length > 0 
                    ? `${Math.round((bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length / bookings.length) * 100)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Réservations ce mois</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {bookings.filter(b => {
                    const bookingDate = new Date(b.created_at);
                    const now = new Date();
                    return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
                  }).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Revenus ce mois</span>
                <span className="text-sm font-semibold text-primary-700">
                  {invoices.filter(i => {
                    const invoiceDate = new Date(i.created_at);
                    const now = new Date();
                    return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear() && i.status === 'paid';
                  }).reduce((sum, i) => sum + i.amount, 0)}€
                </span>
              </div>
            </div>
          </BentoCard>

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
            <h3 className="text-lg font-semibold text-neutral-900">Réalisations ({portfolio.length}{subscriptionPlan === 'free' ? '/5' : ''})</h3>
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
            <h3 className="text-lg font-semibold text-neutral-900">Créneaux spécifiques</h3>
            <p className="mt-1 text-sm text-neutral-500">Ajoutez des créneaux de disponibilité pour des dates spécifiques</p>
            
            <div className="mt-4">
              <button
                onClick={() => setShowSlotForm(true)}
                className="btn-primary"
              >
                <Plus size={18} />
                Ajouter un créneau
              </button>
            </div>

            {showSlotForm && (
              <div className="mt-6 rounded-lg border border-neutral-200 p-4">
                <h4 className="font-semibold text-neutral-900">Nouveau créneau</h4>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label">Date</label>
                    <input
                      type="date"
                      value={slotForm.date}
                      onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                      className="input-field"
                      min={new Date().toISOString().split('T')[0]}
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
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="slot-available"
                    checked={slotForm.is_available}
                    onChange={(e) => setSlotForm({ ...slotForm, is_available: e.target.checked })}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="slot-available" className="text-sm text-neutral-700">Disponible</label>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={createAvailabilitySlot}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setShowSlotForm(false)}
                    className="btn-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-2">
              {availabilitySlots.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucun créneau spécifique défini</p>
              ) : (
                availabilitySlots.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-neutral-900">{new Date(slot.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <p className="text-sm text-neutral-500">{slot.start_time} - {slot.end_time}</p>
                      </div>
                      <span className={`badge ${slot.is_available ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-600'}`}>
                        {slot.is_available ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteAvailabilitySlot(slot.id)}
                      className="text-error-600 hover:bg-error-50 rounded-lg p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
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

      {/* Bookings management */}
      {tab === 'bookings' && (
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-900">Réservations</h3>
            <p className="mt-1 text-sm text-neutral-500">Gérez vos réservations de clients</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Total</p>
                <p className="mt-2 text-2xl font-bold text-neutral-900">{bookings.length}</p>
              </div>
              <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-warning-700">En attente</p>
                <p className="mt-2 text-2xl font-bold text-warning-900">{bookings.filter((b) => b.status === 'pending').length}</p>
              </div>
              <div className="rounded-2xl border border-success-200 bg-success-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-success-700">Escrow sécurisé</p>
                <p className="mt-2 text-2xl font-bold text-success-900">{bookings.filter((b) => b.payment_status === 'held' || b.payment_status === 'completed').length}</p>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle size={48} className="mx-auto text-neutral-300" />
                  <p className="mt-3 text-sm text-neutral-500">Aucune réservation pour le moment</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="rounded-lg border border-neutral-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {booking.client?.avatar_url ? (
                          <img src={booking.client.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
                            {booking.client?.full_name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-neutral-900">{booking.client?.full_name || 'Client'}</p>
                          <p className="text-sm text-neutral-500">{booking.client?.email || ''}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-sm text-neutral-600">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(booking.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {new Date(booking.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {booking.location_type === 'remote' ? 'À distance' : booking.location_type === 'in_person' ? 'En personne' : 'Hybride'}
                            </span>
                          </div>
                          {booking.service_type && (
                            <p className="mt-1 text-sm text-neutral-600">Service: {booking.service_type}</p>
                          )}
                          {booking.notes && (
                            <p className="mt-1 text-sm text-neutral-500 italic">Note: {booking.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`badge ${
                          booking.status === 'pending' ? 'bg-warning-50 text-warning-700' :
                          booking.status === 'confirmed' ? 'bg-success-50 text-success-700' :
                          booking.status === 'completed' ? 'bg-primary-50 text-primary-700' :
                          booking.status === 'rejected' ? 'bg-error-50 text-error-700' :
                          'bg-neutral-100 text-neutral-600'
                        }`}>
                          {booking.status === 'pending' ? 'En attente' :
                           booking.status === 'confirmed' ? 'Confirmée' :
                           booking.status === 'completed' ? 'Terminée' :
                           booking.status === 'rejected' ? 'Refusée' :
                           booking.status === 'cancelled' ? 'Annulée' : booking.status}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button
                              onClick={() => downloadMissionContract(booking)}
                              className="btn-secondary text-xs"
                            >
                              <FileText size={14} />
                              Contrat
                            </button>
                          )}
                          {booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                disabled={saving}
                                className="btn-secondary text-xs"
                              >
                                <Check size={14} />
                                Accepter
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'rejected')}
                                disabled={saving}
                                className="btn-secondary text-xs text-error-600 hover:bg-error-50"
                              >
                                <X size={14} />
                                Refuser
                              </button>
                            </div>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
                              disabled={saving}
                              className="btn-secondary text-xs"
                            >
                              <CheckCircle2 size={14} />
                              Marquer terminée
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoices management */}
      {tab === 'invoices' && (
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Invoice Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary-100 text-primary-600">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Total factures</p>
                  <p className="text-2xl font-bold text-neutral-900">{invoices.length}</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-success-100 text-success-600">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Payées</p>
                  <p className="text-2xl font-bold text-neutral-900">{invoices.filter((i) => i.status === 'paid').length}</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-warning-100 text-warning-600">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">En attente</p>
                  <p className="text-2xl font-bold text-neutral-900">{invoices.filter((i) => i.status === 'sent' || i.status === 'draft').length}</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-accent-100 text-accent-600">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Revenus</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0).toFixed(2)} €
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Form */}
          {showInvoiceForm && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {editingInvoice ? 'Modifier la facture' : 'Nouvelle facture'}
                </h3>
                <button onClick={() => { setShowInvoiceForm(false); resetInvoiceForm(); setEditingInvoice(null); }} className="btn-ghost">
                  <X size={20} />
                </button>
              </div>

              {saveMsg && (
                <div className={`mb-4 p-3 rounded-lg ${saveMsg.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
                  {saveMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Numéro de facture</label>
                  <input
                    type="text"
                    value={invoiceForm.invoice_number}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                    className="input-field"
                    placeholder="INV-XXXXX"
                  />
                </div>
                <div>
                  <label className="label">Devise</label>
                  <select
                    value={invoiceForm.currency}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, currency: e.target.value })}
                    className="input-field"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="XAF">XAF (FCFA)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Date d'émission</label>
                  <input
                    type="date"
                    value={invoiceForm.issue_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Date d'échéance</label>
                  <input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Nom du client</label>
                  <input
                    type="text"
                    value={invoiceForm.client_name}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, client_name: e.target.value })}
                    className="input-field"
                    placeholder="Nom complet"
                  />
                </div>
                <div>
                  <label className="label">Email du client</label>
                  <input
                    type="email"
                    value={invoiceForm.client_email}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, client_email: e.target.value })}
                    className="input-field"
                    placeholder="client@example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Adresse du client</label>
                  <textarea
                    value={invoiceForm.client_address}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, client_address: e.target.value })}
                    className="input-field resize-none"
                    rows={2}
                    placeholder="Adresse complète"
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0">Articles</label>
                  <button onClick={addInvoiceItem} className="btn-secondary text-sm">
                    <Plus size={16} className="mr-1" />
                    Ajouter un article
                  </button>
                </div>
                
                {invoiceForm.items.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
                    <FileText size={32} className="mx-auto text-neutral-300 mb-2" />
                    <p className="text-sm text-neutral-500">Aucun article. Cliquez sur "Ajouter un article" pour commencer.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoiceForm.items.map((item, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                            className="input-field"
                            placeholder="Description de l'article"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="input-field"
                            placeholder="Qté"
                            min="1"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateInvoiceItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="input-field"
                            placeholder="Prix unitaire"
                            step="0.01"
                          />
                        </div>
                        <div className="w-28 text-right py-2">
                          {(item.quantity * item.unit_price).toFixed(2)} {invoiceForm.currency}
                        </div>
                        <button
                          onClick={() => removeInvoiceItem(index)}
                          className="text-error-600 hover:bg-error-50 rounded-lg p-2 mt-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Taux de TVA (%)</label>
                  <input
                    type="number"
                    value={invoiceForm.tax_rate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    step="0.1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Notes</label>
                  <textarea
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Notes ou conditions de paiement..."
                  />
                </div>
              </div>

              {/* Totals */}
              {invoiceForm.items.length > 0 && (
                <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600">Sous-total</span>
                    <span className="font-medium">{calculateInvoiceTotal().subtotal.toFixed(2)} {invoiceForm.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600">TVA ({invoiceForm.tax_rate}%)</span>
                    <span className="font-medium">{calculateInvoiceTotal().taxAmount.toFixed(2)} {invoiceForm.currency}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-200">
                    <span>Total</span>
                    <span className="text-primary-600">{calculateInvoiceTotal().total.toFixed(2)} {invoiceForm.currency}</span>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => { setShowInvoiceForm(false); resetInvoiceForm(); setEditingInvoice(null); }}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={() => editingInvoice ? updateInvoice(editingInvoice.id) : createInvoice()}
                  disabled={saving || invoiceForm.items.length === 0}
                  className="btn-primary"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {editingInvoice ? 'Mettre à jour' : 'Créer la facture'}
                </button>
              </div>
            </div>
          )}

          {/* Invoices List */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Factures</h3>
                <p className="mt-1 text-sm text-neutral-500">Gérez vos factures clients</p>
              </div>
              <button
                onClick={() => setShowInvoiceForm(true)}
                className="btn-primary"
              >
                <Plus size={18} className="mr-2" />
                Nouvelle facture
              </button>
            </div>
            
            <div className="mt-6 space-y-4">
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard size={48} className="mx-auto text-neutral-300" />
                  <p className="mt-3 text-sm text-neutral-500">Aucune facture pour le moment</p>
                  <p className="text-xs text-neutral-400">Les factures sont générées automatiquement après la complétion des réservations</p>
                </div>
              ) : (
                invoices.map((invoice) => {
                  const metadata = invoice.metadata as any || {};
                  const items = metadata.items || [];
                  const { subtotal, taxAmount, total } = calculateInvoiceTotal();
                  
                  return (
                    <div key={invoice.id} className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
                            <CreditCard size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-neutral-900">{invoice.invoice_number}</p>
                              <span className={`badge ${
                                invoice.status === 'paid' ? 'bg-success-50 text-success-700' :
                                invoice.status === 'sent' ? 'bg-primary-50 text-primary-700' :
                                invoice.status === 'overdue' ? 'bg-error-50 text-error-700' :
                                invoice.status === 'draft' ? 'bg-neutral-100 text-neutral-600' :
                                'bg-neutral-100 text-neutral-600'
                              }`}>
                                {invoice.status === 'paid' ? 'Payée' :
                                 invoice.status === 'sent' ? 'Envoyée' :
                                 invoice.status === 'overdue' ? 'En retard' :
                                 invoice.status === 'draft' ? 'Brouillon' :
                                 invoice.status === 'cancelled' ? 'Annulée' : invoice.status}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500">{metadata.client_name || invoice.client?.full_name || 'Client'}</p>
                            {metadata.client_email && (
                              <p className="text-xs text-neutral-400">{metadata.client_email}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-3 text-sm text-neutral-600">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(invoice.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                Échéance: {new Date(invoice.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </span>
                              {invoice.booking && (
                                <span className="flex items-center gap-1">
                                  <MessageCircle size={14} />
                                  Réservation: {invoice.booking.service_type || 'Service'}
                                </span>
                              )}
                            </div>
                            {items.length > 0 && (
                              <div className="mt-2 text-xs text-neutral-500">
                                {items.length} article{items.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-xl font-bold text-neutral-900">{invoice.total_amount || invoice.amount} {invoice.currency}</p>
                          <div className="flex gap-2">
                            {invoice.status === 'draft' && (
                              <>
                                <button
                                  onClick={() => sendInvoice(invoice.id)}
                                  disabled={saving}
                                  className="btn-secondary text-xs"
                                >
                                  <Send size={14} />
                                  Envoyer
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingInvoice(invoice);
                                    setInvoiceForm({
                                      client_name: metadata.client_name || '',
                                      client_email: metadata.client_email || '',
                                      client_address: metadata.client_address || '',
                                      invoice_number: invoice.invoice_number,
                                      issue_date: metadata.issue_date || new Date().toISOString().split('T')[0],
                                      due_date: invoice.due_date,
                                      items: metadata.items || [],
                                      tax_rate: metadata.tax_rate || 20,
                                      notes: invoice.notes || '',
                                      currency: invoice.currency
                                    });
                                    setShowInvoiceForm(true);
                                  }}
                                  className="btn-secondary text-xs"
                                >
                                  <Edit3 size={14} />
                                  Modifier
                                </button>
                              </>
                            )}
                            {invoice.status === 'sent' && (
                              <button
                                onClick={() => markInvoiceAsPaid(invoice.id)}
                                disabled={saving}
                                className="btn-secondary text-xs text-success-600 hover:bg-success-50"
                              >
                                <CheckCircle2 size={14} />
                                Marquer payée
                              </button>
                            )}
                            {(invoice.status === 'draft' || invoice.status === 'sent') && (
                              <button
                                onClick={() => deleteInvoice(invoice.id)}
                                className="btn-ghost text-error-600 hover:bg-error-50 text-xs"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
              })}
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
              <div className="sm:col-span-2">
                <label className="label">Titre / accroche</label>
                <input
                  type="text"
                  value={form.headline as string ?? ''}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  className="input-field"
                  placeholder="Votre spécialité ou votre valeur ajoutée"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Présentation</label>
                <textarea
                  value={form.description as string ?? ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field resize-none"
                  rows={5}
                  placeholder="Décrivez votre activité, votre expertise et votre mode de travail."
                />
              </div>
              <div>
                <label className="label">Compétences (séparées par des virgules)</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="input-field"
                  placeholder="Compétence 1, compétence 2, compétence 3"
                />
              </div>
              <div>
                <label className="label">Langues parlées</label>
                <input
                  type="text"
                  value={languagesInput}
                  onChange={(e) => setLanguagesInput(e.target.value)}
                  className="input-field"
                  placeholder="Langues parlées"
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
                  placeholder="Diplômes, certifications ou accréditations"
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
