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
      className="group card overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5"
    >
      {/* Unified Layout for Mobile and Desktop */}
      <div className="p-5">
        {/* Header Section */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {provider.avatar_url ? (
              <OptimizedImage
                src={provider.avatar_url}
                alt={provider.business_name}
                className="h-16 w-16 rounded-xl object-cover ring-2 ring-white shadow-md"
                loading="lazy"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-xl font-bold text-white ring-2 ring-white shadow-md">
                {provider.business_name[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Name and Info */}
          <div className="min-w-0 flex-1">
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

            {/* Badges */}
            <div className="mt-2 flex flex-wrap gap-1.5">
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
          </div>
        </div>

        {/* Location and Remote Service */}
        {provider.city && (
          <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
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
        <div className="mt-4 flex flex-wrap gap-1.5">
          {provider.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="inline-block px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-medium border border-neutral-200">
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
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-neutral-200">
          <StarRating rating={provider.rating_avg} count={provider.rating_count} showValue />
          {provider.price_range && (
            <span className="text-sm font-bold text-primary-700">{provider.price_range}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default memo(ProviderCard);