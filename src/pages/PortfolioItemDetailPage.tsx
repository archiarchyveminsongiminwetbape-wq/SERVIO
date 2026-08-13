import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, MapPin, DollarSign, Users, Clock, 
  Play, Video, FolderOpen, ExternalLink, Code, FileText, Eye, Share2, Heart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import type { PortfolioItem, ProviderProfile } from '@/types';
import Lightbox from '@/components/Lightbox';
import { formatDate } from '@/lib/utils';

export default function PortfolioItemDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t, locale, isRTL } = useI18n();

  const [item, setItem] = useState<PortfolioItem | null>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!itemId) return;
      setLoading(true);

      // Load portfolio item
      const { data: itemData, error: itemError } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (itemError || !itemData) {
        setLoading(false);
        return;
      }

      setItem(itemData as PortfolioItem);

      // Load provider info
      const { data: providerData } = await supabase
        .from('provider_profiles')
        .select('*, category:categories(*)')
        .eq('id', itemData.provider_id)
        .single();

      if (providerData) {
        setProvider(providerData as ProviderProfile);
      }

      // Increment view count
      await supabase.rpc('increment_portfolio_views', { item_id: itemId });

      setLoading(false);
    }

    loadData();
  }, [itemId]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item?.title,
          text: item?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-neutral-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FolderOpen size={64} className="mx-auto text-neutral-300" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">{t.provider.portfolioItem.noItems}</h3>
          <Link to="/search" className="btn-primary mt-4 inline-block">
            {t.provider.exploreProviders}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">{t.common.back}</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
                title={t.common.share || 'Share'}
              >
                <Share2 size={20} className="text-neutral-600" />
              </button>
              {user && (
                <button
                  onClick={() => setIsFavorited(!isFavorited)}
                  className={`p-2 rounded-full transition-colors ${isFavorited ? 'bg-red-50' : 'hover:bg-neutral-100'}`}
                  title={t.common.favorite || 'Favorite'}
                >
                  <Heart 
                    size={20} 
                    className={isFavorited ? 'text-red-500 fill-red-500' : 'text-neutral-600'} 
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media gallery */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {item.videos && item.videos.length > 0 ? (
                <div className="relative aspect-video bg-black">
                  <video
                    src={item.videos[0]}
                    className="w-full h-full object-contain"
                    controls
                  />
                </div>
              ) : item.photos && item.photos.length > 0 ? (
                <div className="relative aspect-video bg-neutral-100">
                  <img
                    src={item.photos[0]}
                    alt={item.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      setLightboxImages(item.photos);
                      setLightboxIndex(0);
                      setIsLightboxOpen(true);
                    }}
                  />
                  {item.photos.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      <FolderOpen size={14} className="inline mr-1" />
                      {item.photos.length} photos
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-neutral-100 flex items-center justify-center">
                  <FolderOpen size={48} className="text-neutral-300" />
                </div>
              )}

              {/* Photo thumbnails */}
              {item.photos && item.photos.length > 1 && (
                <div className="p-4 grid grid-cols-4 gap-2">
                  {item.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`${item.title} ${index + 1}`}
                      className="w-full aspect-video object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setLightboxImages(item.photos);
                        setLightboxIndex(index);
                        setIsLightboxOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Item details */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h1 className="text-2xl font-bold text-neutral-900 mb-4">{item.title}</h1>
              <p className="text-neutral-600 leading-relaxed mb-6">{item.description}</p>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2">{t.provider.tagsLabel}</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="badge">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Technologies */}
              {item.technologies_used && item.technologies_used.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                    <Code size={16} />
                    Technologies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.technologies_used.map((tech) => (
                      <span key={tech} className="badge bg-primary-50 text-primary-700">{tech}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Project links */}
              {item.project_links && item.project_links.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                    <ExternalLink size={16} />
                    Liens du projet
                  </h3>
                  <div className="space-y-2">
                    {item.project_links.map((link: any, index: number) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <FileText size={16} />
                        {link.label || link.url}
                        <ExternalLink size={14} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* View count */}
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Eye size={16} />
                <span>{item.view_count || 0} {t.common.views}</span>
              </div>
            </div>

            {/* Professional project overview */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-primary-600" />
                  Vue d'ensemble du projet
                </h2>

                {/* Context */}
                {item.context && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-primary-600 mb-2 uppercase tracking-wide">
                      Contexte & Problématique
                    </h3>
                    <p className="text-neutral-600 leading-relaxed">{item.context}</p>
                  </div>
                )}

                {/* Objective */}
                {item.objective && (
                  <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <h3 className="text-sm font-semibold text-neutral-900 mb-2 uppercase tracking-wide">
                      🎯 Objectif
                    </h3>
                    <p className="text-neutral-700 leading-relaxed">{item.objective}</p>
                  </div>
                )}

                {/* Role */}
                {item.role && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-primary-600 mb-2 uppercase tracking-wide">
                      Rôle & Contribution
                    </h3>
                    <p className="text-neutral-600 leading-relaxed">{item.role}</p>
                  </div>
                )}

                {/* Process */}
                {item.process && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-primary-600 mb-2 uppercase tracking-wide">
                      Processus & Méthodologie
                    </h3>
                    <div className="prose prose-sm max-w-none text-neutral-600">
                      {item.process.split('\n').map((line, idx) => (
                        <p key={idx} className="leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result */}
                {item.result && (
                  <div className="mb-6 p-4 bg-success-50 rounded-xl border border-success-200">
                    <h3 className="text-sm font-semibold text-success-700 mb-2 uppercase tracking-wide">
                      ✓ Résultat & Impact
                    </h3>
                    <p className="text-neutral-700 leading-relaxed font-medium">{item.result}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Project details */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Détails du projet</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {item.client_name && (
                  <div className="flex items-start gap-3">
                    <Users size={20} className="text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-500">Client</p>
                      <p className="font-medium text-neutral-900">{item.client_name}</p>
                    </div>
                  </div>
                )}

                {item.project_date && (
                  <div className="flex items-start gap-3">
                    <Calendar size={20} className="text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-500">Date</p>
                      <p className="font-medium text-neutral-900">{formatDate(item.project_date, locale)}</p>
                    </div>
                  </div>
                )}

                {item.budget && (
                  <div className="flex items-start gap-3">
                    <DollarSign size={20} className="text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-500">Budget</p>
                      <p className="font-medium text-neutral-900">{item.budget}</p>
                    </div>
                  </div>
                )}

                {item.location && (
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-500">Lieu</p>
                      <p className="font-medium text-neutral-900">{item.location}</p>
                    </div>
                  </div>
                )}

                {item.duration && (
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-500">Durée</p>
                      <p className="font-medium text-neutral-900">{item.duration}</p>
                    </div>
                  </div>
                )}

                {item.team_size && (
                  <div className="flex items-start gap-3">
                    <Users size={20} className="text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-500">Taille de l'équipe</p>
                      <p className="font-medium text-neutral-900">{item.team_size} personne{item.team_size > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Provider card */}
            {provider && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Prestataire</h3>
                <Link
                  to={`/provider/${provider.slug}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  {provider.avatar_url && (
                    <img
                      src={provider.avatar_url}
                      alt={provider.business_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{provider.business_name}</p>
                    {provider.headline && (
                      <p className="text-sm text-neutral-600 truncate">{provider.headline}</p>
                    )}
                  </div>
                  <ArrowLeft size={20} className={`text-neutral-400 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              </div>
            )}

            {/* Contact CTA */}
            <div className="bg-primary-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Intéressé par ce projet ?</h3>
              <p className="text-sm text-neutral-600 mb-4">Contactez le prestataire pour discuter de vos besoins.</p>
              {provider && (
                <Link
                  to={`/provider/${provider.slug}`}
                  className="btn-primary w-full text-center block"
                >
                  Contacter le prestataire
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <Lightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  );
}
