import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck, Zap, Clock } from 'lucide-react';
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

export default function ProviderCard({ provider }: { provider: ProviderProfile }) {
  const avail = availabilityLabels[provider.availability] ?? availabilityLabels.available;

  return (
    <Link
      to={`/provider/${provider.slug}`}
      className="group card overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="relative h-40 overflow-hidden bg-neutral-100">
        {provider.banner_url ? (
          <img
            src={provider.banner_url}
            alt={provider.business_name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary-100 to-primary-200" />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          {provider.badges.slice(0, 2).map((badge) => {
            const info = badgeLabels[badge];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <span key={badge} className={`badge ${info.color} backdrop-blur-sm`}>
                <Icon size={12} />
                {info.label}
              </span>
            );
          })}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-neutral-700 backdrop-blur-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${avail.color}`} />
          {avail.label}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {provider.avatar_url ? (
              <img
                src={provider.avatar_url}
                alt={provider.business_name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
                loading="lazy"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                {provider.business_name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-neutral-900 group-hover:text-primary-600">
              {provider.business_name}
            </h3>
            <p className="truncate text-xs text-neutral-500">{provider.headline}</p>
          </div>
        </div>

        {provider.city && (
          <div className="mt-3 flex items-center gap-1 text-xs text-neutral-500">
            <MapPin size={12} />
            {provider.city}
            {provider.remote_service && <span className="text-neutral-400">· Service à distance</span>}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {provider.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="badge bg-neutral-100 text-neutral-600">
              {skill}
            </span>
          ))}
          {provider.skills.length > 3 && (
            <span className="badge bg-neutral-100 text-neutral-400">
              +{provider.skills.length - 3}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
          <StarRating rating={provider.rating_avg} count={provider.rating_count} showValue />
          {provider.price_range && (
            <span className="text-xs font-medium text-neutral-600">{provider.price_range}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
