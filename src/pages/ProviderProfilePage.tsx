import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, Mail, Phone, Globe, Star, Calendar, Users, Clock, Search, Filter, Play, Video, 
  Share2, Flag, ChevronLeft, ChevronRight, Briefcase, Award, Languages, Loader2, X, Send, Plus, Eye, FolderOpen,
  BadgeCheck, Zap, MessageSquare, Heart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { ProviderProfile, PortfolioItem, Review } from '@/types';
import StarRating from '@/components/StarRating';
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
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'reviews' | 'about'>('portfolio');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [respondingToReview, setRespondingToReview] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [reviewSort, setReviewSort] = useState<'recent' | 'rating_high' | 'rating_low'>('recent');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [portfolioFilter, setPortfolioFilter] = useState('');
  const [portfolioSort, setPortfolioSort] = useState<'recent' | 'title'>('recent');

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      setLoading(true);

      const { data: provData } = await supabase
        .from('provider_profiles')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .maybeSingle();

      if (!provData) {
        setLoading(false);
        return;
      }
      setProvider(provData as ProviderProfile);

      // Increment view count
      await supabase.rpc('increment_profile_views', { profile_id: provData.id }).then(() => {});

      const [portRes, revRes] = await Promise.all([
        supabase.from('portfolio_items').select('*').eq('provider_id', provData.id).order('sort_order'),
        supabase
          .from('reviews')
          .select('*, author:profiles!reviews_author_id_fkey(id, full_name, avatar_url)')
          .eq('provider_id', provData.id)
          .order('created_at', { ascending: false }),
      ]);

      setPortfolio(portRes.data as PortfolioItem[] ?? []);
      setReviews(revRes.data as Review[] ?? []);
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

  const handleSendMessage = async () => {
    if (!user || !provider) {
      navigate('/login');
      return;
    }
    if (!messageText.trim()) return;

    setSending(true);
    const otherUserId = provider.user_id;

    // Find or create conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_a.eq.${user.id},participant_b.eq.${otherUserId}),and(participant_a.eq.${otherUserId},participant_b.eq.${user.id})`)
      .maybeSingle();

    let convId = existing?.id;

    if (!convId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ participant_a: user.id, participant_b: otherUserId })
        .select('id')
        .single();
      convId = newConv?.id;
    }

    if (convId) {
      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: user.id,
        content: messageText.trim(),
      });
      setMessageText('');
      setShowMessageModal(false);
      navigate('/messages');
    }
    setSending(false);
  };

  const submitReview = async () => {
    if (!user || !provider) {
      navigate('/login');
      return;
    }
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        provider_id: provider.id,
        author_id: user.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      })
      .select('*, author:profiles!reviews_author_id_fkey(id, full_name, avatar_url)')
      .single();

    if (!error && data) {
      setReviews([data as Review, ...reviews]);
      setHasReviewed(true);
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      // Update provider's rating display
      setProvider({
        ...provider,
        rating_count: provider.rating_count + 1,
        rating_avg: ((provider.rating_avg * provider.rating_count) + reviewRating) / (provider.rating_count + 1),
      });
    }
    setSubmittingReview(false);
  };

  const submitResponse = async (reviewId: string) => {
    if (!user || !provider || !responseText.trim()) return;

    setSubmittingResponse(true);
    const { error } = await supabase
      .from('reviews')
      .update({
        provider_response: responseText.trim(),
        provider_response_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (!error) {
      setReviews(reviews.map(r => 
        r.id === reviewId 
          ? { ...r, provider_response: responseText.trim(), provider_response_at: new Date().toISOString() }
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
    
    if (portfolioFilter.trim()) {
      const filter = portfolioFilter.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(filter) ||
        item.description?.toLowerCase().includes(filter) ||
        item.tags.some(tag => tag.toLowerCase().includes(filter))
      );
    }
    
    if (portfolioSort === 'recent') {
      return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (portfolioSort === 'title') {
      return filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    return filtered;
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
        <h2 className="text-xl font-semibold text-neutral-900">Profil introuvable</h2>
        <p className="mt-2 text-sm text-neutral-500">Ce prestataire n'existe pas ou n'est plus disponible.</p>
        <Link to="/search" className="btn-primary mt-6">Explorer les prestataires</Link>
      </div>
    );
  }

  const avail = availabilityInfo[provider.availability] ?? availabilityInfo.available;
  const isOwnProfile = user?.id === provider.user_id;

  return (
    <div className="animate-fade-in">
      {/* Banner */}
      <div className="relative h-64 overflow-hidden bg-neutral-200 sm:h-80">
        {provider.banner_url && (
          <img src={provider.banner_url} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="relative -mt-20 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-shrink-0">
            {provider.avatar_url ? (
              <img
                src={provider.avatar_url}
                alt={provider.business_name}
                className="h-32 w-32 rounded-2xl object-cover ring-4 ring-white shadow-lg sm:h-36 sm:w-36"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-primary-100 text-4xl font-bold text-primary-700 ring-4 ring-white shadow-lg sm:h-36 sm:w-36">
                {provider.business_name[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900">{provider.business_name}</h1>
              <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm">
                <span className={`h-1.5 w-1.5 rounded-full ${avail.color}`} />
                {avail.label}
              </div>
            </div>
            <p className="mt-1 text-neutral-600">{provider.headline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
              {provider.city && (
                <span className="flex items-center gap-1"><MapPin size={14} /> {provider.city}</span>
              )}
              {provider.experience_years && (
                <span className="flex items-center gap-1"><Briefcase size={14} /> {provider.experience_years} ans d'expérience</span>
              )}
              <StarRating rating={provider.rating_avg} count={provider.rating_count} showValue />
            </div>
          </div>

          {!isOwnProfile && (
            <div className="flex flex-wrap gap-2 pb-2">
              <button
                onClick={() => setShowMessageModal(true)}
                className="btn-primary"
              >
                <MessageSquare size={18} />
                Envoyer un message
              </button>
              <button
                onClick={toggleFavorite}
                className={`btn-secondary ${isFavorited ? 'text-error-600' : ''}`}
              >
                <Heart size={18} className={isFavorited ? 'fill-error-500' : ''} />
              </button>
              <button onClick={shareProfile} className="btn-secondary">
                <Share2 size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Badges */}
        {provider.badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {provider.badges.map((badge) => {
              const info = badgeLabels[badge];
              if (!info) return null;
              const Icon = info.icon;
              return (
                <span key={badge} className={`badge ${info.color}`}>
                  <Icon size={14} />
                  {info.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 border-b border-neutral-200">
          <div className="flex gap-1">
            {(['portfolio', 'reviews', 'about'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab ? 'text-primary-600' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab === 'portfolio' && `Portfolio (${portfolio.length})`}
                {tab === 'reviews' && `Avis (${reviews.length})`}
                {tab === 'about' && 'À propos'}
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
                        placeholder="Rechercher dans les réalisations..."
                      />
                    </div>
                    <select
                      value={portfolioSort}
                      onChange={(e) => setPortfolioSort(e.target.value as 'recent' | 'title')}
                      className="input-field sm:w-48"
                    >
                      <option value="recent">Plus récents</option>
                      <option value="title">Par titre</option>
                    </select>
                  </div>

                  {/* Portfolio grid */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {getFilteredPortfolio().map((item) => (
                      <div key={item.id} className="card group overflow-hidden">
                        {(item.photos[0] || (item.videos && item.videos[0])) && (
                          <div className="relative h-56 cursor-pointer overflow-hidden bg-neutral-100">
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
                                  {item.videos.length} vidéo{item.videos.length > 1 ? 's' : ''}
                                </div>
                              </div>
                            ) : (
                              <img
                                src={item.photos[0]}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                                onClick={() => setLightbox({ photos: item.photos, index: 0 })}
                              />
                            )}
                            {item.photos.length > 1 && !item.videos?.[0] && (
                              <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                                {item.photos.length} photos
                              </div>
                            )}
                            {item.featured && (
                              <div className="absolute top-2 left-2 rounded-full bg-accent-500 px-2 py-1 text-xs text-white font-semibold">
                                En vedette
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                          {item.description && (
                            <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{item.description}</p>
                          )}
                          
                          {/* Additional project information */}
                          <div className="mt-3 space-y-2">
                            {item.client_name && (
                              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                                <span className="font-medium">Client:</span>
                                <span>{item.client_name}</span>
                              </div>
                            )}
                            {item.project_date && (
                              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                                <Calendar size={12} />
                                <span>{new Date(item.project_date).toLocaleDateString('fr-FR')}</span>
                              </div>
                            )}
                            {item.location && (
                              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                                <MapPin size={12} />
                                <span>{item.location}</span>
                              </div>
                            )}
                            {item.budget && (
                              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                                <span className="font-medium">Budget:</span>
                                <span>{item.budget}</span>
                              </div>
                            )}
                            {item.duration && (
                              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                                <Clock size={12} />
                                <span>{item.duration}</span>
                              </div>
                            )}
                            {item.team_size && (
                              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                                <Users size={12} />
                                <span>{item.team_size} personne{item.team_size > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>

                          {item.technologies_used && item.technologies_used.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {item.technologies_used.slice(0, 3).map((tech) => (
                                <span key={tech} className="badge bg-accent-50 text-accent-700 border border-accent-100 text-xs">
                                  {tech}
                                </span>
                              ))}
                              {item.technologies_used.length > 3 && (
                                <span className="badge bg-neutral-100 text-neutral-600 text-xs">
                                  +{item.technologies_used.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {item.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {item.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="badge bg-primary-50 text-primary-700 border border-primary-100 text-xs">
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="badge bg-neutral-100 text-neutral-600 text-xs">
                                  +{item.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {item.created_at && (
                            <div className="mt-3 flex items-center gap-1 text-xs text-neutral-500">
                              <Clock size={12} />
                              {formatRelativeTime(item.created_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {getFilteredPortfolio().length === 0 && (
                    <div className="text-center py-12">
                      <Search size={48} className="mx-auto text-neutral-300" />
                      <h3 className="mt-4 text-lg font-semibold text-neutral-900">Aucun résultat</h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        Essayez de modifier vos critères de recherche.
                      </p>
                      {portfolioFilter && (
                        <button
                          onClick={() => setPortfolioFilter('')}
                          className="btn-secondary mt-4"
                        >
                          Effacer le filtre
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <FolderOpen size={64} className="mx-auto text-neutral-300" />
                  <h3 className="mt-4 text-lg font-semibold text-neutral-900">Aucune réalisation publiée</h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    Ce prestataire n'a pas encore ajouté de réalisations à son portfolio.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="mx-auto max-w-3xl">
              {!isOwnProfile && user && !hasReviewed && (
                <div className="mb-6">
                  {!showReviewForm ? (
                    <button onClick={() => setShowReviewForm(true)} className="btn-primary w-full">
                      <Plus size={18} />
                      Laisser un avis
                    </button>
                  ) : (
                    <div className="card p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-semibold text-neutral-900">Votre avis</h4>
                        <button onClick={() => setShowReviewForm(false)} className="text-neutral-400 hover:text-neutral-600">
                          <X size={20} />
                        </button>
                      </div>
                      <div className="mb-4">
                        <label className="label">Note</label>
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
                        <label className="label">Commentaire</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="input-field resize-none"
                          rows={4}
                          placeholder="Partagez votre expérience..."
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowReviewForm(false)} className="btn-secondary">Annuler</button>
                        <button
                          onClick={submitReview}
                          disabled={submittingReview || !reviewComment.trim()}
                          className="btn-primary"
                        >
                          {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                          Publier l'avis
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isOwnProfile && !user && (
                <div className="mb-6 rounded-xl bg-primary-50 p-4 text-center">
                  <p className="text-sm text-primary-700">
                    <Link to="/login" className="font-semibold underline">Connectez-vous</Link> pour laisser un avis
                  </p>
                </div>
              )}

              {hasReviewed && !isOwnProfile && (
                <div className="mb-6 flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm text-success-700">
                  <Star size={18} className="fill-success-500 text-success-500" />
                  Vous avez déjà laissé un avis sur ce prestataire
                </div>
              )}

              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">Avis ({reviews.length})</h3>
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value as 'recent' | 'rating_high' | 'rating_low')}
                  className="input-field text-sm py-1.5"
                >
                  <option value="recent">Plus récents</option>
                  <option value="rating_high">Meilleures notes</option>
                  <option value="rating_low">Moins bonnes notes</option>
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
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-neutral-900">{review.author?.full_name ?? 'Anonyme'}</p>
                            <span className="text-xs text-neutral-500">{formatRelativeTime(review.created_at)}</span>
                          </div>
                          <StarRating rating={review.rating} size={14} />
                          {review.comment && (
                            <p className="mt-2 text-sm text-neutral-600">{review.comment}</p>
                          )}
                          {review.provider_response && (
                            <div className="mt-3 rounded-lg bg-neutral-50 p-3">
                              <p className="text-xs font-semibold text-neutral-700">Réponse du prestataire</p>
                              <p className="mt-1 text-sm text-neutral-600">{review.provider_response}</p>
                            </div>
                          )}
                          {isOwnProfile && !review.provider_response && (
                            <button
                              onClick={() => setRespondingToReview(review.id)}
                              className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                            >
                              Répondre à cet avis
                            </button>
                          )}
                          {respondingToReview === review.id && (
                            <div className="mt-3 rounded-lg bg-primary-50 p-3">
                              <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                className="input-field resize-none mb-2"
                                rows={3}
                                placeholder="Votre réponse..."
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => { setRespondingToReview(null); setResponseText(''); }}
                                  className="btn-secondary text-sm py-1.5"
                                >
                                  Annuler
                                </button>
                                <button
                                  onClick={() => submitResponse(review.id)}
                                  disabled={submittingResponse || !responseText.trim()}
                                  className="btn-primary text-sm py-1.5"
                                >
                                  {submittingResponse ? <Loader2 size={14} className="animate-spin" /> : 'Envoyer'}
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
                <p className="text-center text-neutral-500">Aucun avis pour le moment.</p>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="mx-auto max-w-3xl space-y-6">
              {provider.description && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Présentation</h3>
                  <p className="mt-2 leading-relaxed text-neutral-600">{provider.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                    <Briefcase size={20} /> Compétences
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.skills.map((skill) => (
                      <span key={skill} className="badge bg-primary-50 text-primary-700">{skill}</span>
                    ))}
                  </div>
                </div>

                {provider.certifications && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                      <Award size={20} /> Certifications
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600">{provider.certifications}</p>
                  </div>
                )}

                {provider.languages.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                      <Languages size={20} /> Langues
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {provider.languages.map((lang) => (
                        <span key={lang} className="badge bg-neutral-100 text-neutral-700">{lang}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Localisation</h3>
                  <div className="mt-2 space-y-1 text-sm text-neutral-600">
                    {provider.city && <p className="flex items-center gap-1.5"><MapPin size={14} /> {provider.city}</p>}
                    {provider.service_area && <p>Zone d'intervention : {provider.service_area}</p>}
                    {provider.remote_service && <p className="text-success-600">Service à distance disponible</p>}
                  </div>
                </div>

                {provider.price_range && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Tarifs</h3>
                    <p className="mt-2 text-sm text-neutral-600">{provider.price_range}</p>
                  </div>
                )}

                {(provider.phone || provider.website) && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Contact</h3>
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
                    </div>
                  </div>
                )}
              </div>

              {!isOwnProfile && (
                <div className="flex justify-end border-t border-neutral-100 pt-4">
                  <button className="btn-ghost text-neutral-400 hover:text-error-600">
                    <Flag size={16} />
                    Signaler ce profil
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors" onClick={() => setLightbox(null)}>
            <X size={28} />
          </button>
          
          <button
            className="absolute left-4 rounded-full bg-white/10 p-3 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.photos.length) % lightbox.photos.length });
            }}
          >
            <ChevronLeft size={36} />
          </button>
          
          <button
            className="absolute right-4 rounded-full bg-white/10 p-3 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.photos.length });
            }}
          >
            <ChevronRight size={36} />
          </button>
          
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.photos[lightbox.index]}
              alt={`Photo ${lightbox.index + 1}`}
              className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-white text-sm">
              <span>{lightbox.index + 1} / {lightbox.photos.length}</span>
            </div>
          </div>
          
          {/* Thumbnails */}
          {lightbox.photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" onClick={(e) => e.stopPropagation()}>
              {lightbox.photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightbox({ ...lightbox, index: idx })}
                  className={`h-12 w-12 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === lightbox.index ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={photo} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowMessageModal(false)}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">Envoyer un message</h3>
              <button onClick={() => setShowMessageModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={20} />
              </button>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="input-field resize-none mb-4"
              rows={4}
              placeholder="Votre message..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowMessageModal(false)} className="btn-secondary">Annuler</button>
              <button onClick={handleSendMessage} disabled={sending} className="btn-primary">
                {sending ? <Loader2 size={16} className="animate-spin" /> : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
