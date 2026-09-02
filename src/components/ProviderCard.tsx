import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck, Zap, Clock, Briefcase, Star } from 'lucide-react';
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

  const trustSignals = [
    provider.validation_status === 'approved'
      ? { label: 'Profil vérifié', icon: BadgeCheck, color: 'text-success-700 bg-success-50' }
      : null,
    provider.completed_missions && provider.completed_missions > 0
      ? { label: `${provider.completed_missions} missions`, icon: Briefcase, color: 'text-primary-700 bg-primary-50' }
      : null,
    provider.verified_reviews_count && provider.verified_reviews_count > 0
      ? { label: `${provider.verified_reviews_count} avis vérifiés`, icon: Star, color: 'text-amber-700 bg-amber-50' }
      : null,
  ].filter(Boolean) as Array<{ label: string; icon: typeof BadgeCheck; color: string }>;

  return (
    <Link
      to={`/provider/${provider.slug}`}
      className="group relative block overflow-hidden rounded-3xl border border-neutral-200 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(59,130,246,0.18)]"
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary-500/20 via-cyan-400/10 to-transparent" />

      {provider.banner_url ? (
        <div className="relative h-32 overflow-hidden bg-neutral-100">
          <OptimizedImage
            src={provider.banner_url}
            alt={provider.business_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-900/10 to-transparent" />
          {provider.is_featured && (
            <div className="absolute right-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-950">
              En vedette
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-32 bg-gradient-to-br from-primary-100 via-primary-50 to-cyan-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_35%)]" />
          {provider.is_featured && (
            <div className="absolute right-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-950">
              En vedette
            </div>
          )}
        </div>
      )}

      <div className="relative p-5">
        <div className="relative -mt-12 mb-3">
          <div className="inline-block">
            {provider.avatar_url ? (
              <OptimizedImage
                src={provider.avatar_url}
                alt={provider.business_name}
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white shadow-lg border-2 border-white"
                loading="lazy"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-2xl font-bold text-white ring-4 ring-white shadow-lg border-2 border-white">
                {provider.business_name[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">
              {provider.business_name}
            </h3>
            <p className="mt-1 truncate text-sm text-neutral-500">{provider.headline}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 border border-neutral-200 shadow-sm flex-shrink-0">
            <span className={`h-1.5 w-1.5 rounded-full ${avail.color} animate-pulse`} />
            {avail.label}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {provider.badges.slice(0, 2).map((badge) => {
            const info = badgeLabels[badge];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <span key={badge} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${info.color}`}>
                <Icon size={10} />
                {info.label}
              </span>
            );
          })}
        </div>

        {provider.city && (
          <div className="mb-3 flex items-center gap-2 text-sm text-neutral-600">
            <MapPin size={16} className="text-primary-600 flex-shrink-0" />
            <span className="truncate">{provider.city}</span>
            {provider.remote_service && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                À distance
              </span>
            )}
          </div>
        )}

        {trustSignals.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {trustSignals.map(({ label, icon: Icon, color }) => (
              <span key={label} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>
                <Icon size={10} />
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-1.5">
          {provider.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="inline-block rounded-lg border border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100 px-2.5 py-1 text-[11px] font-medium text-primary-700">
              {skill}
            </span>
          ))}
          {provider.skills.length > 3 && (
            <span className="inline-block rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
              +{provider.skills.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <StarRating rating={provider.rating_avg} count={provider.rating_count} showValue />
          {provider.price_range && (
            <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-sm font-bold text-primary-700">{provider.price_range}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default memo(ProviderCard);