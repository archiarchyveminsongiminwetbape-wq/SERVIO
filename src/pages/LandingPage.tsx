import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles, ShieldCheck, MessageSquare, Star, TrendingUp, Users, Award, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDarkMode } from '@/context/DarkModeContext';
import type { Category, ProviderProfile } from '@/types';
import ProviderCard from '@/components/ProviderCard';
import CategoryIcon from '@/components/CategoryIcon';
import { BentoGrid, BentoCard, BentoSection } from '@/components/BentoGrid';
import { BentoStatCard, BentoFeatureCard, BentoActionCard } from '@/components/BentoCard';
import { GlassCard, GlassInput } from '@/components/GlassCard';
import { categoryTaxonomy } from '@/data/categories';

export default function LandingPage() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [featured, setFeatured] = useState<ProviderProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const displayedCategories = showAllCategories 
    ? categoryTaxonomy 
    : categoryTaxonomy.slice(0, 12);

  useEffect(() => {
    async function loadData() {
      const featRes = await supabase
        .from('provider_profiles')
        .select('*, category:categories(*)')
        .eq('validation_status', 'approved')
        .order('is_featured', { ascending: false })
        .order('rating_avg', { ascending: false })
        .limit(6);
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
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.28),_transparent_32%),linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_45%,_#1e3a8a_100%)]">
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/background.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/20 to-transparent" />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-500/25 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-2 sm:px-3 md:px-4 lg:px-8 py-16 sm:py-20 md:py-24 lg:py-32 xl:py-40">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 sm:mb-8 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/20 bg-white/10 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white backdrop-blur-md animate-fade-in">
              <Sparkles size={14} className="sm:size-18 text-primary-200" />
              <span className="hidden sm:inline">La plateforme des prestataires de services</span>
              <span className="sm:hidden">Prestataires de services</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight text-white animate-slide-up">
              Trouvez le bon professionnel,
              <span className="block bg-gradient-to-r from-sky-200 via-white to-primary-100 bg-clip-text text-transparent">au bon moment</span>
            </h1>
            <p className="mx-auto mt-4 sm:mt-6 md:mt-8 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-primary-100 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Des artisans, créatifs, consultants et prestataires de tous secteurs.
              Consultez leurs portfolios et contactez-les directement.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-6 sm:mt-8 md:mt-10 lg:mt-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <GlassCard variant={darkMode ? 'dark' : 'default'} className="flex max-w-2xl items-center gap-2 sm:gap-3 rounded-[20px] sm:rounded-[24px] md:rounded-[28px] border border-white/30 bg-white/90 p-1.5 sm:p-2 shadow-[0_20px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl">
                <GlassInput
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quel service recherchez-vous ?"
                  variant={darkMode ? 'dark' : 'default'}
                  icon={<Search size={18} className="sm:size-20 md:size-22 text-neutral-400" />}
                />
                <button type="submit" className="btn-primary rounded-xl sm:rounded-2xl px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 shadow-[0_14px_32px_rgba(37,99,235,0.45)] text-xs sm:text-sm md:text-base">
                  <span className="hidden sm:inline">Rechercher</span>
                  <span className="sm:hidden">Rechercher</span>
                  <ArrowRight size={16} className="sm:size-18 md:size-20" />
                </button>
              </GlassCard>
            </form>

            <div className="mt-6 sm:mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-2 sm:gap-y-3 text-xs sm:text-sm md:text-base text-primary-100 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm"><ShieldCheck size={14} className="sm:size-16 md:size-18" /> <span className="hidden sm:inline">Profils vérifiés</span><span className="sm:hidden">Vérifiés</span></span>
              <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm"><MessageSquare size={14} className="sm:size-16 md:size-18" /> <span className="hidden sm:inline">Messagerie intégrée</span><span className="sm:hidden">Messagerie</span></span>
              <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm"><Star size={14} className="sm:size-16 md:size-18" /> <span className="hidden sm:inline">Avis clients réels</span><span className="sm:hidden">Avis réels</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-2 sm:px-3 md:px-4 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Explorez par secteur</h2>
            <p className="mt-2 sm:mt-3 text-base sm:text-lg text-neutral-600">Trouvez le professionnel adapté à votre besoin</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {displayedCategories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/search?category=${cat.slug}`}
                className="group flex flex-col items-center rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary-300 hover:shadow-[0_12px_30px_rgba(37,99,235,0.12)]"
              >
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 transition-all duration-200 group-hover:scale-110 group-hover:from-primary-100 group-hover:to-primary-200">
                  <CategoryIcon name={cat.icon ?? ''} size={20} className="sm:size-24 md:size-28" />
                </div>
                <div className="mt-2 sm:mt-3 min-w-0 text-center">
                  <p className="truncate text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-primary-700">{cat.name}</p>
                  <p className="mt-0.5 sm:mt-1 truncate text-[10px] sm:text-xs text-neutral-500">{cat.subcategories.length} spécialités</p>
                </div>
              </Link>
            ))}
          </div>

          {categoryTaxonomy.length > 12 && (
            <div className="text-center mt-6 sm:mt-8">
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="btn-secondary px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm"
              >
                {showAllCategories ? 'Voir moins' : `Voir tous les ${categoryTaxonomy.length} secteurs`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Providers */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-2 sm:px-3 md:px-4 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Prestataires en vedette</h2>
            <p className="mt-2 sm:mt-3 text-base sm:text-lg text-neutral-600">Des professionnels de qualité, prêts à vous accompagner</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-in">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-80 sm:h-96 animate-pulse overflow-hidden">
                  <div className="h-40 sm:h-48 bg-gradient-to-br from-neutral-200 to-neutral-300" />
                  <div className="p-4 sm:p-6">
                    <div className="h-4 sm:h-5 w-3/4 rounded bg-neutral-200" />
                    <div className="mt-2 sm:mt-3 h-3 sm:h-4 w-1/2 rounded bg-neutral-200" />
                    <div className="mt-3 sm:mt-4 h-3 sm:h-4 w-2/3 rounded bg-neutral-200" />
                    <div className="mt-3 sm:mt-4 h-3 sm:h-4 w-1/2 rounded bg-neutral-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-in">
              {featured.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-neutral-100">
                <Search size={24} className="sm:size-32 text-neutral-400" />
              </div>
              <p className="text-base sm:text-lg text-neutral-600">Aucun prestataire disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats - Bento Grid */}
      <BentoSection className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <BentoGrid>
          <BentoStatCard 
            icon={Users} 
            value="10K+" 
            label="Prestataires" 
            trend="+15%" 
            variant="dark"
          />
          <BentoStatCard 
            icon={Award} 
            value="50K+" 
            label="Projets réalisés" 
            trend="+23%" 
            variant="dark"
          />
          <BentoStatCard 
            icon={Star} 
            value="4.8" 
            label="Note moyenne" 
            variant="dark"
          />
          <BentoStatCard 
            icon={Clock} 
            value="24h" 
            label="Temps de réponse" 
            variant="dark"
          />
        </BentoGrid>
      </BentoSection>

      {/* How it works - Bento Grid */}
      <BentoSection title="Comment ça marche" description="Simple, rapide et efficace">
        <BentoGrid>
          <BentoFeatureCard 
            icon={Search}
            title="1. Recherchez"
            description="Explorez les profils par secteur, localisation ou mot-clé. Comparez les portfolios et les avis."
            variant="default"
          />
          <BentoFeatureCard 
            icon={MessageSquare}
            title="2. Contactez"
            description="Envoyez un message directement via la messagerie intégrée. Pas besoin d'outils externes."
            variant="primary"
          />
          <BentoFeatureCard 
            icon={TrendingUp}
            title="3. Collaborez"
            description="Échangez, convenez d'un devis, et laissez votre avis après la prestation."
            variant="default"
          />
        </BentoGrid>
      </BentoSection>

      {/* CTA - Bento Grid */}
      <BentoSection className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        <BentoGrid>
          <BentoCard colSpan={2} variant="gradient" className="flex flex-col justify-center text-center">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white backdrop-blur-sm mb-4 sm:mb-6 mx-auto w-fit">
              <Sparkles size={14} className="sm:size-16" />
              Rejoignez notre communauté
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">Vous êtes prestataire de services ?</h2>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-primary-100">
              Créez votre portfolio professionnel gratuitement et faites-vous contacter
              par des clients qui ont besoin de vos services.
            </p>
          </BentoCard>
          <BentoActionCard 
            icon={ArrowRight}
            title="Commencer maintenant"
            description="Inscription gratuite en 2 minutes"
            action="Créer mon compte"
            onClick={() => navigate('/signup')}
            variant="gradient"
          />
        </BentoGrid>
      </BentoSection>
    </div>
  );
}
