import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, MapPin, Loader2, Frown, Filter, Globe, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category, ProviderProfile } from '@/types';
import ProviderCard from '@/components/ProviderCard';
import CategoryIcon from '@/components/CategoryIcon';
import { BentoGrid, BentoCard } from '@/components/BentoGrid';
import { categoryTaxonomy } from '@/data/categories';
import { countries } from '@/data/countries';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [subCategories, setSubCategories] = useState<typeof categoryTaxonomy[0]['subcategories']>([]);
  const [selectedSubCat, setSelectedSubCat] = useState<string>('');
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [categorySlug, setCategorySlug] = useState(searchParams.get('category') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [country, setCountry] = useState(searchParams.get('country') ?? '');
  const [minRating, setMinRating] = useState(searchParams.get('rating') ?? '');
  const [availability, setAvailability] = useState(searchParams.get('availability') ?? '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') ?? 'featured');
  const [priceRange, setPriceRange] = useState(searchParams.get('price') ?? '');
  const [minExperience, setMinExperience] = useState(searchParams.get('experience') ?? '');
  const [remoteOnly, setRemoteOnly] = useState(searchParams.get('remote') === 'true');
  const [language, setLanguage] = useState(searchParams.get('language') ?? '');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');
  const [responseTime, setResponseTime] = useState(searchParams.get('response') ?? '');

  // Load subcategories when a category is selected
  useEffect(() => {
    if (!categorySlug) {
      setSubCategories([]);
      setSelectedSubCat('');
      return;
    }
    const sector = categoryTaxonomy.find((c) => c.slug === categorySlug);
    if (sector) {
      setSubCategories(sector.subcategories);
      setSelectedSubCat('');
    }
  }, [categorySlug]);

  const doSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('provider_profiles')
        .select('*, category:categories(*)')
        .eq('validation_status', 'approved');

      if (query.trim()) {
        q = q.or(`business_name.ilike.%${query}%,headline.ilike.%${query}%,description.ilike.%${query}%,skills.cs.{${query}}`);
      }
      if (categorySlug) {
        const cat = categoryTaxonomy.find((c) => c.slug === categorySlug);
        if (cat) {
          // If a subcategory is selected, filter by it; otherwise filter by parent + all children
          if (selectedSubCat) {
            const subCat = subCategories.find((sc) => sc.slug === selectedSubCat);
            if (subCat) {
              // Filter by subcategory slug
              q = q.ilike('category_slug', `%${subCat.slug}%`);
            }
          } else {
            // Filter by sector slug
            q = q.ilike('category_slug', `%${cat.slug}%`);
          }
        }
      }
      if (city.trim()) {
        q = q.ilike('city', `%${city}%`);
      }
      if (country.trim()) {
        q = q.eq('country', country);
      }
      if (minRating) {
        q = q.gte('rating_avg', parseFloat(minRating));
      }
      if (availability) {
        q = q.eq('availability', availability);
      }
      if (priceRange) {
        q = q.ilike('price_range', `%${priceRange}%`);
      }
      if (minExperience) {
        q = q.gte('experience_years', parseInt(minExperience));
      }
      if (remoteOnly) {
        q = q.eq('remote_service', true);
      }
      if (language) {
        q = q.contains('languages', [language]);
      }
      if (verifiedOnly) {
        q = q.eq('is_verified', true);
      }
      if (responseTime) {
        q = q.lte('response_time_hours', parseInt(responseTime));
      }

      if (sortBy === 'rating') {
        q = q.order('rating_avg', { ascending: false });
      } else if (sortBy === 'recent') {
        q = q.order('created_at', { ascending: false });
      } else if (sortBy === 'price_low') {
        q = q.order('price_min', { ascending: true });
      } else if (sortBy === 'price_high') {
        q = q.order('price_max', { ascending: false });
      } else if (sortBy === 'experience') {
        q = q.order('experience_years', { ascending: false });
      } else {
        q = q.order('is_featured', { ascending: false }).order('rating_avg', { ascending: false });
      }

      const { data, error: fetchError } = await q.limit(24);
      
      if (fetchError) {
        throw fetchError;
      }
      
      setProviders(data as ProviderProfile[] ?? []);
    } catch (err) {
      console.error('Error searching providers:', err);
      setError('Une erreur est survenue lors de la recherche. Veuillez réessayer.');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [query, categorySlug, selectedSubCat, city, minRating, availability, sortBy, priceRange, minExperience, remoteOnly, language, verifiedOnly, responseTime]);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch();
      const params: Record<string, string> = {};
      if (query) params.q = query;
      if (categorySlug) params.category = categorySlug;
      if (city) params.city = city;
      if (minRating) params.rating = minRating;
      if (availability) params.availability = availability;
      if (priceRange) params.price = priceRange;
      if (minExperience) params.experience = minExperience;
      if (remoteOnly) params.remote = 'true';
      if (language) params.language = language;
      if (verifiedOnly) params.verified = 'true';
      if (responseTime) params.response = responseTime;
      if (sortBy !== 'featured') params.sort = sortBy;
      setSearchParams(params);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, categorySlug, selectedSubCat, city, country, minRating, availability, sortBy, priceRange, minExperience, remoteOnly, language, verifiedOnly, responseTime, categoryTaxonomy, subCategories, doSearch, setSearchParams]);

  const clearFilters = () => {
    setQuery('');
    setCategorySlug('');
    setSelectedSubCat('');
    setCity('');
    setCountry('');
    setMinRating('');
    setAvailability('');
    setPriceRange('');
    setMinExperience('');
    setRemoteOnly(false);
    setLanguage('');
    setVerifiedOnly(false);
    setResponseTime('');
    setSortBy('featured');
  };

  const hasFilters = query || categorySlug || selectedSubCat || city || country || minRating || availability || priceRange || minExperience || remoteOnly || language || verifiedOnly || responseTime;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Explorer les prestataires</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {loading ? 'Recherche en cours...' : `${providers.length} prestataire${providers.length > 1 ? 's' : ''} trouvé${providers.length > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row">
        {/* Filters sidebar */}
        <aside className="lg:w-72 lg:flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <div className="flex items-center justify-between lg:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary w-full"
              >
                <SlidersHorizontal size={16} className="sm:hidden" />
                <SlidersHorizontal size={18} className="hidden sm:block" />
                Filtres
              </button>
            </div>

            <div className={`card p-4 sm:p-5 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="mb-3 sm:mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">Filtres</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                    Effacer
                  </button>
                )}
              </div>

              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="label">Secteur</label>
                  <select
                    value={categorySlug}
                    onChange={(e) => { setCategorySlug(e.target.value); setSelectedSubCat(''); }}
                    className="input-field text-sm"
                  >
                    <option value="">Tous les secteurs</option>
                    {categoryTaxonomy.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {subCategories.length > 0 && (
                  <div>
                    <label className="label">Spécialité</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setSelectedSubCat('')}
                        className={`badge ${!selectedSubCat ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                      >
                        Toutes
                      </button>
                      {subCategories.map((sub) => (
                        <button
                          key={sub.slug}
                          onClick={() => setSelectedSubCat(sub.slug)}
                          className={`badge ${selectedSubCat === sub.slug ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Ville</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input-field pl-9"
                      placeholder="Ex: Paris"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Pays</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="input-field pl-9"
                    >
                      <option value="">Tous les pays</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Note minimale</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Toutes les notes</option>
                    <option value="4">4 étoiles et plus</option>
                    <option value="4.5">4,5 étoiles et plus</option>
                  </select>
                </div>

                <div>
                  <label className="label">Disponibilité</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Tous</option>
                    <option value="available">Disponible</option>
                    <option value="busy">Sur mission</option>
                  </select>
                </div>

                <div>
                  <label className="label">Gamme de prix</label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Tous les prix</option>
                    <option value="€">€ (Économique)</option>
                    <option value="€€">€€ (Standard)</option>
                    <option value="€€€">€€€ (Premium)</option>
                  </select>
                </div>

                <div>
                  <label className="label">Expérience minimale</label>
                  <select
                    value={minExperience}
                    onChange={(e) => setMinExperience(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Tous</option>
                    <option value="1">1+ an</option>
                    <option value="3">3+ ans</option>
                    <option value="5">5+ ans</option>
                    <option value="10">10+ ans</option>
                  </select>
                </div>

                <div>
                  <label className="label">Langue</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Toutes les langues</option>
                    <option value="Français">Français</option>
                    <option value="English">English</option>
                    <option value="Español">Español</option>
                    <option value="Deutsch">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={remoteOnly}
                      onChange={(e) => setRemoteOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">Service à distance uniquement</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">Prestataires vérifiés uniquement</span>
                  </label>
                </div>

                <div>
                  <label className="label">Temps de réponse</label>
                  <select
                    value={responseTime}
                    onChange={(e) => setResponseTime(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Tous</option>
                    <option value="1">Moins d'1 heure</option>
                    <option value="3">Moins de 3 heures</option>
                    <option value="6">Moins de 6 heures</option>
                    <option value="12">Moins de 12 heures</option>
                    <option value="24">Moins de 24 heures</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Results - Bento Grid */}
        <div className="flex-1">
          <BentoGrid>
            <BentoCard colSpan={3} className="p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 sm:max-w-md">
                  <Search size={16} className="sm:hidden absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Search size={18} className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="input-field pl-10 text-sm"
                    placeholder="Rechercher par nom, métier, compétence..."
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field sm:w-48 text-sm"
                >
                  <option value="featured">En vedette</option>
                  <option value="rating">Meilleures notes</option>
                  <option value="recent">Plus récents</option>
                  <option value="price_low">Prix croissant</option>
                  <option value="price_high">Prix décroissant</option>
                  <option value="experience">Plus d'expérience</option>
                </select>
              </div>
            </BentoCard>

            {loading ? (
              <BentoCard colSpan={3} className="flex items-center justify-center py-16 sm:py-20">
                <Loader2 size={28} className="sm:hidden animate-spin text-primary-500" />
                <Loader2 size={32} className="hidden sm:block animate-spin text-primary-500" />
              </BentoCard>
            ) : error ? (
              <BentoCard colSpan={3} className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
                <AlertCircle size={40} className="sm:hidden text-error-500" />
                <AlertCircle size={48} className="hidden sm:block text-error-500" />
                <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-neutral-900">Erreur de recherche</h3>
                <p className="mt-1 text-sm text-neutral-500">{error}</p>
                <button onClick={doSearch} className="btn-primary mt-3 sm:mt-4">
                  Réessayer
                </button>
              </BentoCard>
            ) : providers.length > 0 ? (
              providers.map((p) => (
                <BentoCard key={p.id} className="p-0 overflow-hidden">
                  <ProviderCard provider={p} />
                </BentoCard>
              ))
            ) : (
              <BentoCard colSpan={3} className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
                <Frown size={40} className="sm:hidden text-neutral-300" />
                <Frown size={48} className="hidden sm:block text-neutral-300" />
                <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-neutral-900">Aucun résultat</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Essayez de modifier vos critères de recherche.
                </p>
                {hasFilters && (
                  <button onClick={clearFilters} className="btn-secondary mt-4">
                    <X size={16} />
                    Effacer les filtres
                  </button>
                )}
              </BentoCard>
            )}
          </BentoGrid>
        </div>
      </div>
    </div>
  );
}
