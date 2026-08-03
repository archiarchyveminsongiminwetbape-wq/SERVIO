import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck, Zap, Clock, Heart } from 'lucide-react';
import type { ProviderProfile } from '@/types';
import StarRating from './StarRating';
import { useAuth } from '@/context/AuthContext';
import { isFavorite, toggleFavorite } from '@/services/favoritesService';
import { useState, useEffect } from 'react';

const badgeLabels: Record<string, { label: string; icon: typeof BadgeCheck; color: string }> = {
  'profil-verifie': { label: 'Vérifié', icon: BadgeCheck, color: 'text-success-600 bg-success-50' },
  'reponse-rapide': { label: 'Réponse rapide', icon: Zap, color: 'text-accent-600 bg-accent-50' },
  'nouveau': { label: 'Nouveau', icon: Clock, color: 'text-primary-600 bg-primary-50' },
};

const availabilityLabels: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: 'bg-success-500' },
  busy: { label: 'Sur mission', color: 'bg-accent-500' },
  unavailable: { label: 'Indisponible', color: 'bg-neutral-400' },
};

export default function ProviderCard({ provider }: { provider: ProviderProfile }) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const avail = availabilityLabels[provider.availability] ?? availabilityLabels.available;

  useEffect(() => {
    if (user) {
      isFavorite(user.id, provider.user_id).then(setIsFav);
    }
  }, [user, provider.user_id]);

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    if (!user || loadingFav) return;

    setLoadingFav(true);
    const result = await toggleFavorite(user.id, provider.user_id);
    
    if (result) {
      setIsFav(!isFav);
    }
    
    setLoadingFav(false);
  }

  return (
    <Link
      to={`/provider/${provider.slug}`}
      className="group card overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1"
    >
      <div className="relative h-52 overflow-hidden bg-neutral-100">
        {provider.banner_url ? (
          <img
            src={provider.banner_url}
            alt={provider.business_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary-100 via-primary-200 to-primary-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent" />
        
        <div className="absolute top-4 left-4 flex gap-2">
          {provider.badges.slice(0, 2).map((badge) => {
            const info = badgeLabels[badge];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <span key={badge} className={`badge ${info.color} backdrop-blur-md shadow-sm`}>
                <Icon size={12} />
                {info.label}
              </span>
            );
          })}
        </div>
        
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-700 backdrop-blur-md shadow-sm">
            <span className={`h-2 w-2 rounded-full ${avail.color} animate-pulse`} />
            {avail.label}
          </div>
          {user && (
            <button
              onClick={handleToggleFavorite}
              className="p-2 rounded-full bg-white/95 backdrop-blur-md shadow-sm hover:bg-white transition-colors"
              disabled={loadingFav}
            >
              <Heart
                size={18}
                className={isFav ? 'fill-error-500 text-error-500' : 'text-neutral-400'}
              />
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 -mt-12">
            {provider.avatar_url ? (
              <img
                src={provider.avatar_url}
                alt={provider.business_name}
                className="h-16 w-16 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                loading="lazy"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-lg font-bold text-white ring-4 ring-white shadow-lg">
                {provider.business_name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="truncate text-base font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">
              {provider.business_name}
            </h3>
            <p className="truncate text-sm text-neutral-500 mt-1">{provider.headline}</p>
          </div>
        </div>

        {provider.city && (
          <div className="mt-4 flex items-center gap-1.5 text-sm text-neutral-600">
            <MapPin size={16} className="text-primary-600" />
            {provider.city}
            {provider.remote_service && <span className="text-neutral-400">· Service à distance</span>}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {provider.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="badge bg-primary-50 text-primary-700 border border-primary-100">
              {skill}
            </span>
          ))}
          {provider.skills.length > 3 && (
            <span className="badge bg-neutral-100 text-neutral-600 border border-neutral-200">
              +{provider.skills.length - 3}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
          <StarRating rating={provider.rating_avg} count={provider.rating_count} showValue />
          {provider.price_range && (
            <span className="text-sm font-bold text-primary-700">{provider.price_range}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
