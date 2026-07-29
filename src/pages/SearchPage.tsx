import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, MapPin, Loader2, Frown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category, ProviderProfile } from '@/types';
import ProviderCard from '@/components/ProviderCard';
import CategoryIcon from '@/components/CategoryIcon';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [selectedSubCat, setSelectedSubCat] = useState<string>('');
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [categorySlug, setCategorySlug] = useState(searchParams.get('category') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [minRating, setMinRating] = useState(searchParams.get('rating') ?? '');
  const [availability, setAvailability] = useState(searchParams.get('availability') ?? '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') ?? 'featured');

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      const allCats = data as Category[] ?? [];
      setCategories(allCats.filter((c) => !c.parent_id));
    });
  }, []);

  // Load subcategories when a category is selected
  useEffect(() => {
    if (!categorySlug) {
      setSubCategories([]);
      setSelectedSubCat('');
      return;
    }
    const parent = categories.find((c) => c.slug === categorySlug);
    if (!parent) return;
    supabase.from('categories').select('*').eq('parent_id', parent.id).order('sort_order').then(({ data }) => {
      setSubCategories(data as Category[] ?? []);
      setSelectedSubCat('');
    });
  }, [categorySlug, categories]);

  const doSearch = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('provider_profiles')
      .select('*, category:categories(*)')
      .eq('validation_status', 'approved');

    if (query.trim()) {
      q = q.or(`business_name.ilike.%${query}%,headline.ilike.%${query}%,description.ilike.%${query}%,skills.cs.{${query}}`);
    }
    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) {
        // If a subcategory is selected, filter by it; otherwise filter by parent + all children
        if (selectedSubCat) {
          const subCat = subCategories.find((sc) => sc.slug === selectedSubCat);
          if (subCat) q = q.eq('category_id', subCat.id);
        } else {
          // Get all child category IDs + the parent itself
          const childIds = subCategories.map((sc) => sc.id);
          const allIds = [cat.id, ...childIds];
          q = q.in('category_id', allIds);
        }
      }
    }
    if (city.trim()) {
      q = q.ilike('city', `%${city}%`);
    }
    if (minRating) {
      q = q.gte('rating_avg', parseFloat(minRating));
    }
    if (availability) {
      q = q.eq('availability', availability);
    }

    if (sortBy === 'rating') {
      q = q.order('rating_avg', { ascending: false });
    } else if (sortBy === 'recent') {
      q = q.order('created_at', { ascending: false });
    } else {
      q = q.order('is_featured', { ascending: false }).order('rating_avg', { ascending: false });
    }

    const { data } = await q.limit(24);
    setProviders(data as ProviderProfile[] ?? []);
    setLoading(false);
  }, [query, categorySlug, city, minRating, availability, sortBy, categories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch();
      const params: Record<string, string> = {};
      if (query) params.q = query;
      if (categorySlug) params.category = categorySlug;
      if (city) params.city = city;
      if (minRating) params.rating = minRating;
      if (availability) params.availability = availability;
      if (sortBy !== 'featured') params.sort = sortBy;
      setSearchParams(params);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, categorySlug, selectedSubCat, city, minRating, availability, sortBy, categories, subCategories, doSearch, setSearchParams]);

  const clearFilters = () => {
    setQuery('');
    setCategorySlug('');
    setSelectedSubCat('');
    setCity('');
    setMinRating('');
    setAvailability('');
    setSortBy('featured');
  };

  const hasFilters = query || categorySlug || selectedSubCat || city || minRating || availability;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Explorer les prestataires</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {loading ? 'Recherche en cours...' : `${providers.length} prestataire${providers.length > 1 ? 's' : ''} trouvé${providers.length > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filters sidebar */}
        <aside className="lg:w-72 lg:flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <div className="flex items-center justify-between lg:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary w-full"
              >
                <SlidersHorizontal size={18} />
                Filtres
              </button>
            </div>

            <div className={`card p-5 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">Filtres</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                    Effacer
                  </button>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label className="label">Secteur</label>
                  <select
                    value={categorySlug}
                    onChange={(e) => { setCategorySlug(e.target.value); setSelectedSubCat(''); }}
                    className="input-field"
                  >
                    <option value="">Tous les secteurs</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
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
                          key={sub.id}
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
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input-field pl-10"
                placeholder="Rechercher par nom, métier, compétence..."
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field sm:w-48"
            >
              <option value="featured">En vedette</option>
              <option value="rating">Meilleures notes</option>
              <option value="recent">Plus récents</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
          ) : providers.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {providers.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Frown size={48} className="text-neutral-300" />
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">Aucun résultat</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Essayez de modifier vos critères de recherche.
              </p>
              {hasFilters && (
                <button onClick={clearFilters} className="btn-secondary mt-4">
                  <X size={16} />
                  Effacer les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
