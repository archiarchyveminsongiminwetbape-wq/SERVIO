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
      className="group card overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 border border-neutral-200"
    >
      {/* Banner Image */}
      {provider.banner_url ? (
        <div className="relative h-32 overflow-hidden bg-neutral-100">
          <OptimizedImage
            src={provider.banner_url}
            alt={provider.business_name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200" />
      )}

      {/* Content */}
      <div className="p-5 relative">
        {/* Avatar - Overlapping banner */}
        <div className="relative -mt-12 mb-3">
          <div className="inline-block">
            {provider.avatar_url ? (
              <OptimizedImage
                src={provider.avatar_url}
                alt={provider.business_name}
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white shadow-lg border-2 border-neutral-100"
                loading="lazy"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-2xl font-bold text-white ring-4 ring-white shadow-lg border-2 border-neutral-100">
                {provider.business_name[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Name and Info */}
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">
                {provider.business_name}
              </h3>
              <p className="truncate text-sm text-neutral-500 mt-0.5">{provider.headline}</p>
            </div>
            {/* Availability Badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 border border-neutral-200 shadow-sm flex-shrink-0">
              <span className={`h-1.5 w-1.5 rounded-full ${avail.color} animate-pulse`} />
              {avail.label}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {provider.badges.slice(0, 2).map((badge) => {
            const info = badgeLabels[badge];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <span key={badge} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
                <Icon size={10} />
                {info.label}
              </span>
            );
          })}
        </div>

        {/* Location and Remote Service */}
        {provider.city && (
          <div className="mb-3 flex items-center gap-2 text-sm text-neutral-600">
            <MapPin size={16} className="text-primary-600 flex-shrink-0" />
            <span className="truncate">{provider.city}</span>
            {provider.remote_service && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                À distance
              </span>
            )}
          </div>
        )}

        {/* Skills */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {provider.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="inline-block px-2.5 py-1 bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700 rounded-lg text-xs font-medium border border-primary-200">
              {skill}
            </span>
          ))}
          {provider.skills.length > 3 && (
            <span className="inline-block px-2.5 py-1 bg-neutral-50 text-neutral-500 rounded-lg text-xs font-medium border border-neutral-200">
              +{provider.skills.length - 3}
            </span>
          )}
        </div>

        {/* Footer: Rating and Price */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <StarRating rating={provider.rating_avg} count={provider.rating_count} showValue />
          {provider.price_range && (
            <span className="text-sm font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded-lg">{provider.price_range}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default memo(ProviderCard);