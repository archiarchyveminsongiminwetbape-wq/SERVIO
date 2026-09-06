import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, Mail, Phone, Globe, Star, Calendar, Clock, 
  Share2, ChevronLeft, ChevronRight, Briefcase, Award, Languages, Loader2, X, Send, Eye, FolderOpen,
  BadgeCheck, Zap, MessageSquare, Heart, FileText, ExternalLink, Flag, Search, Filter, Plus, Play, Edit3, Quote, BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import type { ProviderProfile, PortfolioItem, Review, ReviewResponse, Testimonial, Certification, ProviderStats } from '@/types';
import StarRating from '@/components/StarRating';
import VerifiedBadge from '@/components/VerifiedBadge';
import Lightbox from '@/components/Lightbox';
import { formatDate, formatRelativeTime } from '@/lib/utils';

const badgeLabels: Record<string, { label: string; icon: typeof BadgeCheck; color: string }> = {
  'profil-verifie': { label: 'Profil vérifié', icon: BadgeCheck, color: 'text-success-600 bg-success-50' },
  'reponse-rapide': { label: 'Réponse rapide', icon: Zap, color: 'text-accent-600 bg-accent-50' },
  'nouveau': { label: 'Nouveau', icon: Clock, color: 'text-primary-600 bg-primary-50' },
};

const availabilityInfo: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: 'bg-success-500' },
  busy: { label: 'Sur mission', color: 'bg-accent-500' },
  unavailable: { label: 'Indisponible', color: 'bg-neutral-400' },
};

export default function ProviderProfilePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t, locale, isRTL } = useI18n();

  // Update badge labels with translations
  const getBadgeLabel = (badgeKey: string) => {
    if (badgeKey === 'profil-verifie') return t.provider.badges.verified;
    if (badgeKey === 'reponse-rapide') return t.provider.badges.fastResponse;
    if (badgeKey === 'nouveau') return t.provider.badges.new;
    return badgeLabels[badgeKey]?.label || badgeKey;
  };

  // Update availability info with translations
  const getAvailabilityLabel = (status: string) => {
    if (status === 'available') return t.provider.availability.available;
    if (status === 'busy') return t.provider.availability.busy;
    if (status === 'unavailable') return t.provider.availability.unavailable;
    return availabilityInfo[status]?.label || status;
  };
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [providerStats, setProviderStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'reviews' | 'testimonials' | 'about'>('portfolio');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [respondingToReview, setRespondingToReview] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [reviewSort, setReviewSort] = useState<'recent' | 'rating_high' | 'rating_low'>('recent');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [portfolioFilter, setPortfolioFilter] = useState('');
  const [portfolioSort, setPortfolioSort] = useState<'recent' | 'title' | 'featured' | 'oldest'>('recent');
  const [portfolioTypeFilter, setPortfolioTypeFilter] = useState<'all' | 'photos' | 'videos'>('all');
  const [portfolioTagFilter, setPortfolioTagFilter] = useState('');
  const [portfolioYearFilter, setPortfolioYearFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [completedMissions, setCompletedMissions] = useState(0);
  const [canLeaveVerifiedReview, setCanLeaveVerifiedReview] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      setLoading(true);

      const normalizedSlug = slug.trim().toLowerCase();
      const { data: provData, error: provError } = await supabase
        .from('provider_profiles')
        .select('id, user_id, business_name, headline, avatar_url, banner_url, city, country, remote_service, skills, badges, rating_avg, rating_count, price_range, availability, slug, category_id, experience_years, languages, validation_status, is_featured, description, website, phone, social_links, created_at')
        .eq('slug', normalizedSlug)
        .limit(1)
        .maybeSingle();

      if (!provData) {
        console.log('Provider profile not found for slug:', slug);
        console.log('Error details:', JSON.stringify(provError, null, 2));
        setLoading(false);
        return;
      }

      let category = null;
      if (provData.category_id) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id, name, slug, parent_id, icon, description, sort_order, created_at')
          .eq('id', provData.category_id)
          .maybeSingle();
        category = categoryData;
      }

      let ownerAvatarUrl: string | null = null;
      if (provData.user_id) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', provData.user_id)
          .maybeSingle();
        ownerAvatarUrl = ownerData?.avatar_url ?? null;
      }

      setProvider({
        ...(provData as ProviderProfile),
        category,
        avatar_url: provData.avatar_url || ownerAvatarUrl,
      });

      // Increment view count
      await supabase.rpc('increment_profile_views', { profile_id: provData.id }).then(() => {});

      // Track portfolio views if available
      const portRes = await supabase
        .from('portfolio_items')
        .select('id, provider_id, title, description, photos, videos, video_thumbnails, tags, project_links, client_name, project_date, budget, location, featured, technologies_used, duration, team_size, context, objective, role, process, result, sort_order, created_at')
        .eq('provider_id', provData.id)
        .order('sort_order');

      setPortfolio(portRes.data as PortfolioItem[] ?? []);

      // Increment portfolio item views in background
      // TODO: Create increment_portfolio_views RPC function in Supabase
      // if (portRes.data && portRes.data.length > 0) {
      //   portRes.data.forEach(async (item) => {
      //     await supabase.rpc('increment_portfolio_views', { item_id: item.id }).then(() => {});
      //   });
      // }

      const { data: completedBookings } = await supabase
        .from('bookings')
        .select('id, client_id, provider_id, status')
        .eq('provider_id', provData.id)
        .eq('status', 'completed');

      const completedMissionCount = completedBookings?.length ?? 0;
      setCompletedMissions(completedMissionCount);

      const revRes = await supabase
        .from('reviews')
        .select('id, provider_id, author_id, rating, comment, created_at, updated_at')
        .eq('provider_id', provData.id)
        .order('created_at', { ascending: false });

      const reviewsData = revRes.data ?? [];
      const verifiedAuthorIds = new Set((completedBookings ?? []).map((booking) => booking.client_id));

      // Load responses for each review
      const reviewsWithResponses = await Promise.all(
        reviewsData.map(async (review) => {
          const { data: responses } = await supabase
            .from('review_responses')
            .select('id, review_id, responder_id, response, created_at, updated_at, responder:profiles(id, full_name, avatar_url)')
            .eq('review_id', review.id);

          return {
            ...review,
            is_verified: verifiedAuthorIds.has(review.author_id),
            responses: responses as unknown as ReviewResponse[] ?? [],
          };
        })
      );
      const authorIds = Array.from(new Set(reviewsData.map((review) => review.author_id)));
      let authorProfiles: Array<{ id: string; full_name: string | null; avatar_url: string | null }> = [];
      if (authorIds.length > 0) {
        const { data: authorRes } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', authorIds);
        authorProfiles = authorRes ?? [];
      }

      const authorMap = new Map(authorProfiles.map((author) => [author.id, author]));
      const reviewsWithAuthors = reviewsWithResponses.map((review) => ({
        ...review,
        author: authorMap.get(review.author_id) ?? null,
      }));
      setReviews(reviewsWithAuthors);

      // Load testimonials
      const { data: testimonialsData } = await supabase
        .from('testimonials')
        .select('*')
        .eq('provider_id', provData.id)
        .eq('is_verified', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      setTestimonials(testimonialsData as Testimonial[] ?? []);

      // Load certifications
      const { data: certificationsData } = await supabase
        .from('certifications')
        .select('*')
        .eq('provider_id', provData.id)
        .order('is_verified', { ascending: false })
        .order('expiration_date', { ascending: false, nullsFirst: false });

      setCertifications(certificationsData as Certification[] ?? []);

      // Load provider stats
      const { data: statsData } = await supabase
        .from('provider_stats')
        .select('*')
        .eq('provider_id', provData.id)
        .maybeSingle();

      setProviderStats(statsData as ProviderStats | null);

      setLoading(false);

      // Check if current user already left a review
      if (user) {
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('provider_id', provData.id)
          .eq('author_id', user.id)
          .maybeSingle();
        setHasReviewed(!!existingReview);

        const { data: completedUserBooking } = await supabase
          .from('bookings')
          .select('id')
          .eq('provider_id', provData.id)
          .eq('client_id', user.id)
          .eq('status', 'completed')
          .limit(1);

        setCanLeaveVerifiedReview(Boolean(completedUserBooking && completedUserBooking.length > 0));
      }

      // Check favorite
      if (user) {
        const { data: fav } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('provider_id', provData.id)
          .maybeSingle();
        setIsFavorited(!!fav);
      }
    }
    loadData();
  }, [slug, user]);

  const toggleFavorite = async () => {
    if (!user || !provider) {
      navigate('/login');
      return;
    }
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('provider_id', provider.id);
      setIsFavorited(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, provider_id: provider.id });
      setIsFavorited(true);
    }
  };

  const handleReportProfile = async () => {
    if (!user || !provider) {
      navigate('/login');
      return;
    }
    if (!reportReason.trim()) {
      setReportError('Veuillez préciser le motif du signalement.');
      return;
    }

    setReporting(true);
    setReportError(null);

    try {
      const { error } = await supabase.from('reports').insert({
        report_type: 'profile',
        target_id: provider.id,
        reporter_id: user.id,
        reason: reportReason.trim(),
        status: 'open',
      });

      if (error) {
        throw error;
      }

      setShowReportModal(false);
      setReportReason('');
      setReportError(null);
    } catch (error: any) {
      console.error('Profile report error:', error);
      setReportError(error?.message || 'Une erreur est survenue lors du signalement.');
    } finally {
      setReporting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !provider) {
      navigate('/login');
      return;
    }
    if (!messageText.trim()) {
      setMessageError('Le message est requis.');
      return;
    }

    setMessageError(null);
    setSending(true);
    const otherUserId = provider.user_id;

    try {
      // Find or create conversation
      const { data: existing, error: existingError } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_a.eq.${user.id},participant_b.eq.${otherUserId}),and(participant_a.eq.${otherUserId},participant_b.eq.${user.id})`
        )
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      let convId = existing?.id;

      if (!convId) {
        const { data: newConv, error: newConvError } = await supabase
          .from('conversations')
          .insert({ participant_a: user.id, participant_b: otherUserId })
          .select('id')
          .single();

        if (newConvError) {
          throw newConvError;
        }

        convId = newConv?.id;
      }

      if (!convId) {
        throw new Error('Impossible de créer la conversation.');
      }

      const { error: messageErrorInsert } = await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: user.id,
        content: messageText.trim(),
      });

      if (messageErrorInsert) {
        throw messageErrorInsert;
      }

      setMessageText('');
      setShowMessageModal(false);
      navigate(`/messages?conversationId=${convId}`);
    } catch (error: any) {
      console.error('Message send error:', error);
      setMessageError(error?.message || 'Une erreur est survenue lors de l’envoi du message.');
    } finally {
      setSending(false);
    }
  };

  const submitReview = async () => {
    if (!user || !provider) {
      navigate('/login');
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError((t.provider as any).reviewCommentRequired || 'Veuillez saisir un avis.');
      return;
    }

    const { data: completedUserBooking, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('provider_id', provider.id)
      .eq('client_id', user.id)
      .eq('status', 'completed')
      .limit(1);

    if (bookingError) {
      setReviewError(bookingError.message || 'Une erreur est survenue lors de la vérification de votre mission.');
      setSubmittingReview(false);
      return;
    }

    if (!completedUserBooking || completedUserBooking.length === 0) {
      setReviewError('Les avis sont vérifiés uniquement après une mission complétée.');
      setSubmittingReview(false);
      return;
    }

    setReviewError(null);
    setSubmittingReview(true);
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        provider_id: provider.id,
        author_id: user.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      })
      .select('*')
      .single();

    if (!error && data) {
      const newReview = {
        ...data,
        author: profile ?? null,
      } as Review;
      setReviews([newReview, ...reviews]);
      setHasReviewed(true);
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      setReviewError(null);
      // Update provider's rating display
      setProvider({
        ...provider,
        rating_count: provider.rating_count + 1,
        rating_avg: ((provider.rating_avg * provider.rating_count) + reviewRating) / (provider.rating_count + 1),
      });
    } else {
      setReviewError(error?.message ?? t.common.error ?? 'Une erreur est survenue lors de la publication de l’avis.');
    }
    setSubmittingReview(false);
  };

  const submitResponse = async (reviewId: string) => {
    if (!user || !provider || !responseText.trim()) return;

    setSubmittingResponse(true);
    const { data, error } = await supabase
      .from('review_responses')
      .insert({
        review_id: reviewId,
        responder_id: user.id,
        response: responseText.trim(),
      })
      .select('id, review_id, responder_id, response, created_at, updated_at, responder:profiles(id, full_name, avatar_url)')
      .single();

    if (!error && data) {
      setReviews(reviews.map(r => 
        r.id === reviewId 
          ? { ...r, responses: [...(r.responses || []), data as unknown as ReviewResponse] }
          : r
      ));
      setRespondingToReview(null);
      setResponseText('');
    }
    setSubmittingResponse(false);
  };

  const getSortedReviews = () => {
    const sorted = [...reviews];
    if (reviewSort === 'recent') {
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (reviewSort === 'rating_high') {
      return sorted.sort((a, b) => b.rating - a.rating);
    } else if (reviewSort === 'rating_low') {
      return sorted.sort((a, b) => a.rating - b.rating);
    }
    return sorted;
  };

  const getFilteredPortfolio = () => {
    let filtered = [...portfolio];
    
    // Filter by type (photos/videos)
    if (portfolioTypeFilter === 'photos') {
      filtered = filtered.filter(item => item.photos.length > 0);
    } else if (portfolioTypeFilter === 'videos') {
      filtered = filtered.filter(item => item.videos && item.videos.length > 0);
    }
    
    // Filter by search query
    if (portfolioFilter.trim()) {
      const filter = portfolioFilter.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(filter) ||
        item.description?.toLowerCase().includes(filter) ||
        item.tags.some(tag => tag.toLowerCase().includes(filter))
      );
    }
    
    // Filter by tag
    if (portfolioTagFilter.trim()) {
      filtered = filtered.filter(item => 
        item.tags.some(tag => tag.toLowerCase().includes(portfolioTagFilter.toLowerCase()))
      );
    }
    
    // Filter by year
    if (portfolioYearFilter.trim()) {
      filtered = filtered.filter(item => {
        if (!item.project_date) return false;
        const itemYear = new Date(item.project_date).getFullYear().toString();
        return itemYear === portfolioYearFilter;
      });
    }
    
    // Sort
    if (portfolioSort === 'recent') {
      return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (portfolioSort === 'oldest') {
      return filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (portfolioSort === 'title') {
      return filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (portfolioSort === 'featured') {
      return filtered.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    
    return filtered;
  };

  const getAvailableYears = () => {
    const years = new Set<number>();
    portfolio.forEach(item => {
      if (item.project_date) {
        years.add(new Date(item.project_date).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: provider?.business_name,
          text: provider?.headline ?? '',
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-neutral-900">{t.provider.profileNotFound}</h2>
        <p className="mt-2 text-sm text-neutral-500">{t.provider.profileNotFoundSubtext}</p>
        <Link to="/search" className="btn-primary mt-6">{t.provider.exploreProviders}</Link>
      </div>
    );
  }

  const avail = availabilityInfo[provider.availability] ?? availabilityInfo.available;
  const isOwnProfile = user?.id === provider.user_id;

  const verificationChecks = (() => {
    const checks = new Set<string>(provider.verification_checks ?? []);

    if (provider.validation_status === 'approved') {
      checks.add('Identité vérifiée');
      checks.add('Profil validé');
      checks.add('Expérience et compétences confirmées');
    } else if (provider.validation_status === 'pending') {
      checks.add('Validation en cours');
      checks.add('Délai indicatif : 24 à 48h');
    } else if (provider.validation_status === 'changes_requested') {
      checks.add('Modifications demandées');
      checks.add('Documents ou informations manquants');
    } else if (provider.validation_status === 'rejected') {
      checks.add('Profil non validé');
      checks.add('Vérification refusée');
    }

    if (provider.city) checks.add('Localisation renseignée');
    if (provider.phone) checks.add('Téléphone vérifié');
    if (provider.website) checks.add('Site web renseigné');
    if ((provider.skills?.length ?? 0) > 0) checks.add('Compétences déclarées');
    if ((provider.experience_years ?? 0) > 0) checks.add('Expérience confirmée');

    return Array.from(checks).slice(0, 6);
  })();

  const validationSummary = (() => {
    if (provider.validation_status === 'approved') {
      return {
        title: 'Profil vérifié',
        tone: 'success',
        text: 'Ce profil a été validé sur les éléments clés : identité, présentation et compétences.',
      };
    }

    if (provider.validation_status === 'changes_requested') {
      return {
        title: 'Validation incomplète',
        tone: 'warning',
        text: 'Des informations complémentaires sont nécessaires avant validation. Le délai indicatif reste de 24 à 48h après soumission.',
      };
    }

    if (provider.validation_status === 'rejected') {
      return {
        title: 'Profil non validé',
        tone: 'error',
        text: 'Le profil n’a pas été validé pour le moment et doit être complété ou corrigé.',
      };
    }

    return {
      title: 'Validation en cours',
      tone: 'neutral',
      text: 'Notre équipe vérifie le profil, la qualité de la présentation et les informations du prestataire. Délai indicatif : 24 à 48h.',
    };
  })();

  return (
    <div className="animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="relative h-32 overflow-hidden bg-neutral-200 sm:h-40 md:h-52">
        {provider.banner_url ? (
          <img src={provider.banner_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary-200 via-primary-100 to-cyan-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/10 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-10 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
          <div className="flex-shrink-0">
            {provider.avatar_url ? (
              <img
                src={provider.avatar_url}
                alt={provider.business_name}
                className="h-20 w-20 rounded-[1.6rem] object-cover ring-4 ring-white shadow-[0_22px_48px_rgba(15,23,42,0.18)] sm:h-28 sm:w-28"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-primary-500 to-primary-600 text-3xl font-bold text-white ring-4 ring-white shadow-[0_22px_48px_rgba(15,23,42,0.18)] sm:h-28 sm:w-28 sm:text-4xl">
                {provider.business_name[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 sm:text-3xl">{provider.business_name}</h1>
              <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-neutral-200">
                <span className={`h-1.5 w-1.5 rounded-full ${avail.color}`} />
                {getAvailabilityLabel(provider.availability)}
              </div>
            </div>
            <p className="mt-1 text-sm text-neutral-600 sm:text-base">{provider.headline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 sm:gap-x-4 sm:text-sm">
              {provider.city && (
                <span className="flex items-center gap-1"><MapPin size={14} /> {provider.city}</span>
              )}
              {provider.experience_years && (
                <span className="flex items-center gap-1"><Briefcase size={14} /> {provider.experience_years} {t.provider.yearsOfExperienceLabel}</span>
              )}
              <StarRating rating={provider.rating_avg} count={provider.rating_count} showValue />
              <span className="flex items-center gap-1"><Briefcase size={14} /> {completedMissions} missions</span>
              <span className="flex items-center gap-1"><Eye size={14} /> {provider.profile_views || 0} {t.common.views}</span>
            </div>
          </div>

          {isOwnProfile ? (
            <div className="flex flex-wrap gap-2 pb-2">
              <button
                onClick={() => navigate('/provider/edit')}
                className="btn-primary text-sm sm:text-base"
              >
                <Edit3 size={16} />
                Modifier mon profil
              </button>
              <button onClick={shareProfile} className="btn-secondary">
                <Share2 size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pb-2">
              <button
                onClick={() => setShowMessageModal(true)}
                className="btn-primary text-sm sm:text-base"
              >
                <MessageSquare size={16} className="sm:hidden" />
                <MessageSquare size={18} className="hidden sm:block" />
                <span className="hidden sm:inline">{t.provider.sendMessage}</span>
              </button>
              <button
                onClick={toggleFavorite}
                className={`btn-secondary ${isFavorited ? 'border-red-200 bg-red-50 text-red-600' : ''}`}
              >
                <Heart size={16} className="sm:hidden" />
                <Heart size={18} className="hidden sm:block" />
              </button>
              <button onClick={shareProfile} className="btn-secondary">
                <Share2 size={16} className="sm:hidden" />
                <Share2 size={18} className="hidden sm:block" />
              </button>
            </div>
          )}
        </div>

        {/* Badges */}
        {provider.badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {provider.badges.map((badge) => {
              if (badge === 'profil-verifie') {
                return <VerifiedBadge key={badge} size={14} showLabel={true} variant="small" />;
              }
              const info = badgeLabels[badge];
              if (!info) return null;
              const Icon = info.icon;
              return (
                <span
                  key={badge}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium ${info.color}`}
                >
                  <Icon size={12} />
                  {getBadgeLabel(badge)}
                </span>
              );
            })}
          </div>
        )}

        <div className={`mt-4 rounded-2xl border p-4 ${
          validationSummary.tone === 'success'
            ? 'border-success-200 bg-success-50'
            : validationSummary.tone === 'warning'
            ? 'border-amber-200 bg-amber-50'
            : validationSummary.tone === 'error'
            ? 'border-error-200 bg-error-50'
            : 'border-primary-200 bg-primary-50'
        }`}>
          <div className="flex items-center gap-2">
            <BadgeCheck size={18} className={
              validationSummary.tone === 'success'
                ? 'text-success-600'
                : validationSummary.tone === 'warning'
                ? 'text-amber-600'
                : validationSummary.tone === 'error'
                ? 'text-error-600'
                : 'text-primary-600'
            } />
            <p className="text-sm font-semibold text-neutral-900">{validationSummary.title}</p>
          </div>
          <p className="mt-2 text-sm text-neutral-700">{validationSummary.text}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {verificationChecks.map((check) => (
              <span key={check} className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700">
                {check}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 sm:mt-8 border-b border-neutral-200 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {(['portfolio', 'reviews', 'testimonials', 'about'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab ? 'text-primary-600' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab === 'portfolio' && `${t.provider.portfolio} (${portfolio.length})`}
                {tab === 'reviews' && `${t.provider.reviews} (${reviews.length})`}
                {tab === 'testimonials' && `Témoignages (${testimonials.length})`}
                {tab === 'about' && t.provider.aboutTab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="py-8">
          {activeTab === 'portfolio' && (
            <div>
              {portfolio.length > 0 ? (
                <>
                  {/* Portfolio filters and controls */}
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        value={portfolioFilter}
                        onChange={(e) => setPortfolioFilter(e.target.value)}
                        className="input-field pl-10"
                        placeholder={t.provider.searchPortfolio}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={portfolioTypeFilter}
                        onChange={(e) => setPortfolioTypeFilter(e.target.value as 'all' | 'photos' | 'videos')}
                        className="input-field sm:w-40"
                      >
                        <option value="all">{t.provider.allMedia}</option>
                        <option value="photos">{t.provider.photosLabel}</option>
                        <option value="videos">{t.provider.videosLabel}</option>
                      </select>
                      <select
                        value={portfolioSort}
                        onChange={(e) => setPortfolioSort(e.target.value as 'recent' | 'title' | 'featured' | 'oldest')}
                        className="input-field sm:w-40"
                      >
                        <option value="recent">{t.provider.mostRecent}</option>
                        <option value="oldest">{t.common.previous}</option>
                        <option value="featured">{t.provider.featured}</option>
                        <option value="title">{t.provider.byTitle}</option>
                      </select>
                      <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`btn-secondary ${showAdvancedFilters ? 'bg-primary-100 text-primary-700' : ''}`}
                      >
                        <Filter size={18} />
                        {t.common.filters}
                      </button>
                    </div>
                  </div>

                  {/* Tag filter */}
                  {portfolio.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2 items-center">
                      <span className="text-sm font-medium text-neutral-700">{t.provider.tagsLabel}:</span>
                      <button
                        onClick={() => setPortfolioTagFilter('')}
                        className={`badge ${!portfolioTagFilter ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                      >
                        {t.provider.allLabel}
                      </button>
                      {Array.from(new Set(portfolio.flatMap(item => item.tags))).slice(0, 10).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setPortfolioTagFilter(tag)}
                          className={`badge ${portfolioTagFilter === tag ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Advanced filters */}
                  {showAdvancedFilters && (
                    <div className="mb-6 rounded-xl bg-neutral-50 p-4 space-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <label className="text-sm font-medium text-neutral-700">{t.common.filter} par {t.common.year}:</label>
                        <select
                          value={portfolioYearFilter}
                          onChange={(e) => setPortfolioYearFilter(e.target.value)}
                          className="input-field sm:w-40"
                        >
                          <option value="">{t.common.allYears}</option>
                          {getAvailableYears().map(year => (
                            <option key={year} value={year.toString()}>{year}</option>
                          ))}
                        </select>
                        {(portfolioTagFilter || portfolioYearFilter) && (
                          <button
                            onClick={() => {
                              setPortfolioTagFilter('');
                              setPortfolioYearFilter('');
                            }}
                            className="btn-secondary text-sm"
                          >
                            {t.provider.clearFilter}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Portfolio grid */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {getFilteredPortfolio().map((item) => (
                      <div key={item.id} className="card group overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                        <Link to={`/portfolio/${item.id}`}>
                          {(item.photos[0] || (item.videos && item.videos[0])) && (
                            <div className="relative h-56 overflow-hidden bg-neutral-100">
                              {item.videos && item.videos[0] ? (
                                <div className="relative h-full w-full">
                                  <video
                                    src={item.videos[0]}
                                    className="h-full w-full object-cover"
                                    muted
                                    onMouseEnter={(e) => e.currentTarget.play()}
                                    onMouseLeave={(e) => e.currentTarget.pause()}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play size={32} className="text-white" />
                                  </div>
                                  <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white flex items-center gap-1">
                                    <Video size={12} />
                                    {item.videos.length} {t.provider.videoCount}{item.videos.length > 1 ? 's' : ''}
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={item.photos[0]}
                                  alt={item.title}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setLightboxImages(item.photos);
                                    setLightboxIndex(0);
                                    setIsLightboxOpen(true);
                                  }}
                                />
                              )}
                              {item.photos.length > 1 && !item.videos?.[0] && (
                                <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white flex items-center gap-1">
                                  <FolderOpen size={12} />
                                  {item.photos.length} {t.provider.photoCount}{item.photos.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                            <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{item.description}</p>
                            {item.tags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {item.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="badge text-xs">{tag}</span>
                                ))}
                              </div>
                            )}
                            {item.project_date && (
                              <div className="mt-2 text-xs text-neutral-500">
                                {formatDate(item.project_date, locale)}
                              </div>
                            )}
                            <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
                              <Eye size={12} />
                              <span>{item.view_count || 0} {t.common.views}</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>

                  {getFilteredPortfolio().length === 0 && (
                    <div className="text-center py-12">
                      <Search size={48} className="mx-auto text-neutral-300" />
                      <h3 className="mt-4 text-lg font-semibold text-neutral-900">{t.provider.noResults}</h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        {t.provider.tryDifferentFilters}
                      </p>
                      {portfolioFilter && (
                        <button
                          onClick={() => setPortfolioFilter('')}
                          className="btn-secondary mt-4"
                        >
                          {t.provider.clearFilter}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <FolderOpen size={64} className="mx-auto text-neutral-300" />
                  <h3 className="mt-4 text-lg font-semibold text-neutral-900">{t.provider.noPortfolioItems}</h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    {t.provider.noPortfolioItemsSubtext}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="mx-auto max-w-3xl">
              {!isOwnProfile && user && !hasReviewed && (
                <div className="mb-6">
                  {!canLeaveVerifiedReview && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Les avis sont vérifiés uniquement après une mission complétée. Une réservation terminée permettra d’écrire un avis.
                    </div>
                  )}

                  {!showReviewForm ? (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      disabled={!canLeaveVerifiedReview}
                      className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={18} />
                      {t.provider.leaveReview}
                    </button>
                  ) : (
                    <div className="card p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-semibold text-neutral-900">{t.provider.yourReview}</h4>
                        <button onClick={() => setShowReviewForm(false)} className="text-neutral-400 hover:text-neutral-600">
                          <X size={20} />
                        </button>
                      </div>
                      <div className="mb-4">
                        <label className="label">{t.provider.ratingLabel}</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => setReviewRating(n)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                size={28}
                                className={n <= reviewRating ? 'fill-accent-400 text-accent-400' : 'fill-neutral-200 text-neutral-200'}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm font-medium text-neutral-700">{reviewRating}/5</span>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="label">{t.provider.commentLabel}</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="input-field resize-none"
                          rows={4}
                          placeholder={t.provider.shareExperience}
                        />
                        {reviewError && (
                          <p className="mt-2 text-sm text-error-600">{reviewError}</p>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowReviewForm(false)} className="btn-secondary">{t.common.cancel}</button>
                        <button
                          onClick={submitReview}
                          disabled={submittingReview || !reviewComment.trim()}
                          className="btn-primary"
                        >
                          {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                          {t.provider.publishReview}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isOwnProfile && !user && (
                <div className="mb-6 rounded-xl bg-primary-50 p-4 text-center">
                  <p className="text-sm text-primary-700">
                    <Link to="/login" className="font-semibold underline">{t.auth.login}</Link> {t.provider.loginToReview}
                  </p>
                </div>
              )}

              {hasReviewed && !isOwnProfile && (
                <div className="mb-6 flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm text-success-700">
                  <Star size={18} className="fill-success-500 text-success-500" />
                  {t.provider.alreadyReviewed}
                </div>
              )}

              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">{t.provider.reviews} ({reviews.length})</h3>
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value as 'recent' | 'rating_high' | 'rating_low')}
                  className="input-field text-sm py-1.5"
                >
                  <option value="recent">{t.provider.mostRecentReviews}</option>
                  <option value="rating_high">{t.provider.highestRated}</option>
                  <option value="rating_low">{t.provider.lowestRated}</option>
                </select>
              </div>

              {getSortedReviews().length > 0 ? (
                <div className="space-y-4">
                  {getSortedReviews().map((review) => (
                    <div key={review.id} className="card p-5">
                      <div className="flex items-start gap-3">
                        {review.author?.avatar_url ? (
                          <img src={review.author.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-600">
                            {review.author?.full_name?.[0]?.toUpperCase() ?? 'A'}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-neutral-900">{review.author?.full_name ?? t.provider.anonymous}</p>
                              {review.is_verified && (
                                <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-success-700">
                                  Avis vérifié
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-neutral-500">{formatRelativeTime(review.created_at)}</span>
                          </div>
                          <StarRating rating={review.rating} size={14} />
                          {review.comment && (
                            <p className="mt-2 text-sm text-neutral-600">{review.comment}</p>
                          )}
                          {review.responses && review.responses.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {review.responses.map((response) => (
                                <div key={response.id} className="rounded-lg bg-neutral-50 p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    {response.responder?.avatar_url ? (
                                      <img src={response.responder.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                                    ) : (
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                                        {response.responder?.full_name?.[0]?.toUpperCase() ?? 'P'}
                                      </div>
                                    )}
                                    <p className="text-xs font-semibold text-neutral-700">
                                      {response.responder?.full_name || t.provider.providerResponse}
                                    </p>
                                    <span className="text-xs text-neutral-400">
                                      {formatRelativeTime(response.created_at)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-neutral-600">{response.response}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {isOwnProfile && (
                            <button
                              onClick={() => setRespondingToReview(review.id)}
                              className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                            >
                              {t.provider.respondToReview}
                            </button>
                          )}
                          {respondingToReview === review.id && (
                            <div className="mt-3 rounded-lg bg-primary-50 p-3">
                              <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                className="input-field resize-none mb-2"
                                rows={3}
                                placeholder={t.provider.yourResponse}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => { setRespondingToReview(null); setResponseText(''); }}
                                  className="btn-secondary text-sm py-1.5"
                                >
                                  {t.common.cancel}
                                </button>
                                <button
                                  onClick={() => submitResponse(review.id)}
                                  disabled={submittingResponse || !responseText.trim()}
                                  className="btn-primary text-sm py-1.5"
                                >
                                  {submittingResponse ? <Loader2 size={14} className="animate-spin" /> : t.provider.send}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-neutral-500">{t.provider.noReviewsYet}</p>
              )}
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="mx-auto max-w-3xl">
              {testimonials.length > 0 ? (
                <div className="space-y-6">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className={`card p-6 ${testimonial.is_featured ? 'border-2 border-accent-200 bg-accent-50' : ''}`}>
                      {testimonial.is_featured && (
                        <div className="mb-4 flex items-center gap-2 text-accent-600">
                          <Star size={16} fill="currentColor" />
                          <span className="text-sm font-semibold">Témoignage mis en avant</span>
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        {testimonial.client_avatar_url ? (
                          <img src={testimonial.client_avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
                            {testimonial.client_name[0]?.toUpperCase() ?? 'C'}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-neutral-900">{testimonial.client_name}</p>
                              {testimonial.project_title && (
                                <p className="text-sm text-neutral-600">{testimonial.project_title}</p>
                              )}
                            </div>
                            {testimonial.project_date && (
                              <span className="text-xs text-neutral-500">{formatDate(testimonial.project_date, locale)}</span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}
                              />
                            ))}
                          </div>
                          <div className="mt-3 relative">
                            <Quote size={24} className="absolute -top-2 -left-2 text-neutral-200" />
                            <p className="pl-6 text-sm text-neutral-700 italic">{testimonial.testimonial}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Quote size={64} className="mx-auto text-neutral-300" />
                  <h3 className="mt-4 text-lg font-semibold text-neutral-900">Aucun témoignage</h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    Ce prestataire n'a pas encore de témoignages clients.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="mx-auto max-w-3xl space-y-6">
              {provider.description && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">{t.provider.presentation}</h3>
                  <p className="mt-2 leading-relaxed text-neutral-600">{provider.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                    <Briefcase size={20} /> {t.provider.fields.skills}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.skills.map((skill) => (
                      <span key={skill} className="badge bg-primary-50 text-primary-700">{skill}</span>
                    ))}
                  </div>
                </div>

                {certifications.length > 0 ? (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                      <Award size={20} /> Certifications
                    </h3>
                    <div className="mt-3 space-y-3">
                      {certifications.map((cert) => (
                        <div key={cert.id} className={`card p-4 ${cert.is_verified ? 'border-success-200 bg-success-50' : 'border-neutral-200'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-neutral-900">{cert.title}</p>
                                {cert.is_verified && (
                                  <BadgeCheck size={16} className="text-success-600" />
                                )}
                              </div>
                              <p className="mt-1 text-sm text-neutral-600">{cert.issuing_organization}</p>
                              {cert.credential_id && (
                                <p className="text-xs text-neutral-500">ID: {cert.credential_id}</p>
                              )}
                              {cert.description && (
                                <p className="mt-2 text-sm text-neutral-700">{cert.description}</p>
                              )}
                              {cert.skills.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {cert.skills.map((skill) => (
                                    <span key={skill} className="badge text-xs bg-primary-50 text-primary-700">{skill}</span>
                                  ))}
                                </div>
                              )}
                              <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                                {cert.issue_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {formatDate(cert.issue_date, locale)}
                                  </span>
                                )}
                                {cert.expiration_date && (
                                  <span className={`flex items-center gap-1 ${new Date(cert.expiration_date) < new Date() ? 'text-error-600' : ''}`}>
                                    <Clock size={12} />
                                    Exp: {formatDate(cert.expiration_date, locale)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {cert.verification_url && (
                              <a
                                href={cert.verification_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700"
                              >
                                <ExternalLink size={16} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : provider.certifications ? (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                      <Award size={20} /> {t.provider.fields.certifications}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600">{provider.certifications}</p>
                  </div>
                ) : null}

                {providerStats && (
                  <div className="sm:col-span-2">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                      <BarChart3 size={20} /> Statistiques de performance
                    </h3>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="card p-3 text-center">
                        <p className="text-2xl font-bold text-primary-600">{providerStats.response_rate.toFixed(0)}%</p>
                        <p className="text-xs text-neutral-600">Taux de réponse</p>
                      </div>
                      <div className="card p-3 text-center">
                        <p className="text-2xl font-bold text-success-600">{providerStats.satisfaction_score.toFixed(1)}/10</p>
                        <p className="text-xs text-neutral-600">Satisfaction</p>
                      </div>
                      <div className="card p-3 text-center">
                        <p className="text-2xl font-bold text-accent-600">{providerStats.on_time_completion_rate.toFixed(0)}%</p>
                        <p className="text-xs text-neutral-600">À l'heure</p>
                      </div>
                      <div className="card p-3 text-center">
                        <p className="text-2xl font-bold text-neutral-600">{providerStats.completed_bookings}</p>
                        <p className="text-xs text-neutral-600">Missions complétées</p>
                      </div>
                    </div>
                    {providerStats.average_response_time_hours && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
                        <Clock size={14} />
                        <span>Temps de réponse moyen: {providerStats.average_response_time_hours.toFixed(1)}h</span>
                      </div>
                    )}
                  </div>
                )}

                {provider.languages.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                      <Languages size={20} /> {t.provider.fields.languages}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {provider.languages.map((lang) => (
                        <span key={lang} className="badge bg-neutral-100 text-neutral-700">{lang}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">{(t.provider as any).location || 'Localisation'}</h3>
                  <div className="mt-2 space-y-1 text-sm text-neutral-600">
                    {provider.city && <p className="flex items-center gap-1.5"><MapPin size={14} /> {provider.city}</p>}
                    {provider.service_area && <p>{t.provider.fields.serviceArea} : {provider.service_area}</p>}
                    {provider.remote_service && <p className="text-success-600">{t.provider.fields.remoteService}</p>}
                  </div>
                </div>

                {provider.price_range && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{(t.provider as any).pricing || 'Tarifs'}</h3>
                    <p className="mt-2 text-sm text-neutral-600">{provider.price_range}</p>
                  </div>
                )}

                {(provider.phone || provider.website || provider.social_links) && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{(t.provider as any).contact || 'Contact & Réseaux'}</h3>
                    <div className="mt-2 space-y-1 text-sm text-neutral-600">
                      {provider.phone && <p className="flex items-center gap-1.5"><Phone size={14} /> {provider.phone}</p>}
                      {provider.website && (
                        <p className="flex items-center gap-1.5">
                          <Globe size={14} />
                          <a href={`https://${provider.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                            {provider.website}
                          </a>
                        </p>
                      )}
                      {provider.social_links && Object.keys(provider.social_links).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {provider.social_links.linkedin && (
                            <a
                              href={provider.social_links.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0077b5] text-white text-sm hover:bg-[#006397] transition-colors"
                            >
                              LinkedIn
                            </a>
                          )}
                          {provider.social_links.twitter && (
                            <a
                              href={provider.social_links.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1da1f2] text-white text-sm hover:bg-[#1a91da] transition-colors"
                            >
                              Twitter
                            </a>
                          )}
                          {provider.social_links.instagram && (
                            <a
                              href={provider.social_links.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743] text-white text-sm hover:opacity-90 transition-opacity"
                            >
                              Instagram
                            </a>
                          )}
                          {provider.social_links.facebook && (
                            <a
                              href={provider.social_links.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1877f2] text-white text-sm hover:bg-[#166fe5] transition-colors"
                            >
                              Facebook
                            </a>
                          )}
                          {provider.social_links.youtube && (
                            <a
                              href={provider.social_links.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ff0000] text-white text-sm hover:bg-[#e60000] transition-colors"
                            >
                              YouTube
                            </a>
                          )}
                          {provider.social_links.github && (
                            <a
                              href={provider.social_links.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-sm hover:bg-neutral-800 transition-colors"
                            >
                              GitHub
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!isOwnProfile && (
                <div className="flex justify-end border-t border-neutral-100 pt-4">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="btn-ghost text-neutral-400 hover:text-error-600"
                  >
                    <Flag size={16} />
                    {t.provider.reportProfile}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        alt={provider?.business_name || 'Portfolio image'}
      />

      {/* Report profile modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">{t.provider.reportProfile}</h3>
              <button onClick={() => setShowReportModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={20} />
              </button>
            </div>

            <label className="label">Motif du signalement</label>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="input-field resize-none"
              rows={4}
              placeholder="Décrivez le problème constaté sur ce profil ou cet avis..."
            />
            {reportError && (
              <p className="mt-2 text-sm text-error-600">{reportError}</p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowReportModal(false)} className="btn-secondary">{t.common.cancel}</button>
              <button onClick={handleReportProfile} disabled={reporting || !reportReason.trim()} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                {reporting ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowMessageModal(false)}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">{t.provider.sendMessage}</h3>
              <button onClick={() => setShowMessageModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={20} />
              </button>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="input-field resize-none mb-4"
              rows={4}
              placeholder={t.provider.message.placeholder}
            />
            {messageError && (
              <p className="mb-4 text-sm text-error-600">{messageError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowMessageModal(false)} className="btn-secondary">{t.common.cancel}</button>
              <button onClick={handleSendMessage} disabled={sending} className="btn-primary">
                {sending ? <Loader2 size={16} className="animate-spin" /> : t.provider.message.send}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
