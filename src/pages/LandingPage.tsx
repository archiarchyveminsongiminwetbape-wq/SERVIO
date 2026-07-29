import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles, ShieldCheck, MessageSquare, Star, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category, ProviderProfile } from '@/types';
import ProviderCard from '@/components/ProviderCard';
import CategoryIcon from '@/components/CategoryIcon';

export default function LandingPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<ProviderProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [catRes, featRes] = await Promise.all([
        supabase.from('categories').select('*').is('parent_id', null).order('sort_order'),
        supabase
          .from('provider_profiles')
          .select('*, category:categories(*)')
          .eq('validation_status', 'approved')
          .order('is_featured', { ascending: false })
          .order('rating_avg', { ascending: false })
          .limit(6),
      ]);
      setCategories(catRes.data as Category[] ?? []);
      setFeatured(featRes.data as ProviderProfile[] ?? []);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800">
        <div className="absolute inset-0 opacity-10">
          <img
            src="/images/background.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/40 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <Sparkles size={16} />
              La plateforme des prestataires de services
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Trouvez le bon professionnel,
              <span className="block text-primary-200">au bon moment</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-100">
              Des artisans, créatifs, consultants et prestataires de tous secteurs.
              Consultez leurs portfolios et contactez-les directement.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-2 shadow-xl">
              <div className="relative flex-1">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quel service recherchez-vous ?"
                  className="w-full rounded-xl border-0 bg-transparent py-3 pl-10 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-0"
                />
              </div>
              <button type="submit" className="btn-primary rounded-xl px-6 py-3">
                Rechercher
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-100">
              <span className="flex items-center gap-1.5"><ShieldCheck size={16} /> Profils vérifiés</span>
              <span className="flex items-center gap-1.5"><MessageSquare size={16} /> Messagerie intégrée</span>
              <span className="flex items-center gap-1.5"><Star size={16} /> Avis clients réels</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Explorer par secteur</h2>
            <p className="mt-1 text-sm text-neutral-600">{categories.length} secteurs d'activité disponibles</p>
          </div>
          <Link to="/search" className="hidden text-sm font-semibold text-primary-600 hover:text-primary-700 sm:block">
            Tout voir →
          </Link>
        </div>

        <div className={`mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${showAllCategories ? '' : 'max-h-[28rem] overflow-hidden'}`}>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/search?category=${cat.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
                <CategoryIcon name={cat.icon ?? ''} size={22} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900">{cat.name}</p>
                <p className="truncate text-xs text-neutral-500">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {categories.length > 8 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="btn-secondary"
            >
              {showAllCategories ? (
                <><ChevronUp size={18} /> Voir moins</>
              ) : (
                <><ChevronDown size={18} /> Voir tous les secteurs ({categories.length})</>
              )}
            </button>
          </div>
        )}
      </section>

      {/* Featured Providers */}
      <section className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Prestataires en vedette</h2>
              <p className="mt-1 text-sm text-neutral-600">Des professionnels de qualité, prêts à vous accompagner</p>
            </div>
            <Link to="/search" className="hidden text-sm font-semibold text-primary-600 hover:text-primary-700 sm:block">
              Voir tous les prestataires →
            </Link>
          </div>

          {loading ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-80 animate-pulse overflow-hidden">
                  <div className="h-40 bg-neutral-200" />
                  <div className="p-4">
                    <div className="h-4 w-3/4 rounded bg-neutral-200" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-neutral-200" />
                    <div className="mt-4 h-3 w-2/3 rounded bg-neutral-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center text-neutral-500">Aucun prestataire disponible pour le moment.</p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900">Comment ça marche</h2>
          <p className="mt-1 text-sm text-neutral-600">Simple, rapide et efficace</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Search size={26} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900">1. Recherchez</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Explorez les profils par secteur, localisation ou mot-clé.
              Comparez les portfolios et les avis.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <MessageSquare size={26} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900">2. Contactez</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Envoyz un message directement via la messagerie intégrée.
              Pas besoin d'outils externes.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <TrendingUp size={26} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900">3. Collaborez</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Échangez, convenez d'un devis, et laissez votre avis
              après la prestation.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Vous êtes prestataire de services ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-100">
            Créez votre portfolio professionnel gratuitement et faites-vous contacter
            par des clients qui ont besoin de vos services.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary-700 shadow-lg transition-all hover:bg-primary-50 hover:shadow-xl"
          >
            Créer mon portfolio
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
