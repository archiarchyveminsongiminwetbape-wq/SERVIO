import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck, Zap, Clock } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import type { ProviderProfile } from '@/types';
import StarRating from './StarRating';

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

// ===== IMAGE OPTIMIZATION =====
interface ImageProps {
  src: string | undefined | null;
  alt: string;
  className: string;
  loading?: 'lazy' | 'eager';
}

const OptimizedImage = memo(({ src, alt, className, loading = 'lazy' }: ImageProps) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (src) {
      setImageSrc(src);
    }
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${!isLoaded ? 'blur-sm' : ''} transition-all duration-300`}
      loading={loading}
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        // Fallback if image fails to load
        setImageSrc(undefined);
      }}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

function ProviderCard({ provider }: { provider: ProviderProfile }) {
  const avail = availabilityLabels[provider.availability] ?? availabilityLabels.available;

  return (
    <Link
      to={`/provider/${provider.slug}`}
      className="group card overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1"
    >
      <div className="relative h-40 sm:h-48 md:h-52 overflow-hidden bg-neutral-100">
        {provider.banner_url ? (
          <OptimizedImage
            src={provider.banner_url}
            alt={provider.business_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary-100 via-primary-200 to-primary-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent" />
        
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex gap-1 sm:gap-2">
          {provider.badges.slice(0, 2).map((badge) => {
            const info = badgeLabels[badge];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <span key={badge} className={`badge ${info.color} backdrop-blur-md shadow-sm text-[10px] sm:text-xs`}>
                <Icon size={10} className="sm:size-12" />
                {info.label}
              </span>
            );
          })}
        </div>
        
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/95 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-neutral-700 backdrop-blur-md shadow-sm">
          <span className={`h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full ${avail.color} animate-pulse`} />
          {avail.label}
        </div>
      </div>

      <div className="p-5 sm:p-6 md:p-7">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 -mt-8 sm:-mt-10 md:-mt-12">
            {provider.avatar_url ? (
              <OptimizedImage
                src={provider.avatar_url}
                alt={provider.business_name}
                className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-xl sm:rounded-2xl object-cover ring-3 sm:ring-4 ring-white shadow-lg"
                loading="lazy"
              />
            ) : (
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-base sm:text-lg md:text-xl font-bold text-white ring-3 sm:ring-4 ring-white shadow-lg">
                {provider.business_name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-2">
            <h3 className="truncate text-base sm:text-lg md:text-xl font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">
              {provider.business_name}
            </h3>
            <p className="truncate text-sm sm:text-base text-neutral-500 mt-1">{provider.headline}</p>
          </div>
        </div>

        {provider.city && (
          <div className="mt-3 sm:mt-4 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-neutral-600">
            <MapPin size={14} className="sm:size-16 text-primary-600" />
            {provider.city}
            {provider.remote_service && <span className="text-neutral-400">· Service à distance</span>}
          </div>
        )}

        <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
          {provider.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="badge bg-primary-50 text-primary-700 border border-primary-100 text-[10px] sm:text-xs">
              {skill}
            </span>
          ))}
          {provider.skills.length > 3 && (
            <span className="badge bg-neutral-100 text-neutral-600 border border-neutral-200 text-[10px] sm:text-xs">
              +{provider.skills.length - 3}
            </span>
          )}
        </div>

        <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 sm:pt-4">
          <StarRating rating={provider.rating_avg} count={provider.rating_count} showValue />
          {provider.price_range && (
            <span className="text-xs sm:text-sm font-bold text-primary-700">{provider.price_range}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default memo(ProviderCard);
