import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles, ShieldCheck, MessageSquare, Star, TrendingUp, Users, Award, Clock, Quote, Check, Play, ChevronRight } from 'lucide-react';
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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/background.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 via-primary-900/30 to-transparent" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-500/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-white backdrop-blur-md border border-white/20 animate-fade-in">
              <Sparkles size={16} className="text-primary-200" />
              La plateforme des prestataires de services
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight text-white animate-slide-up">
              Trouvez le bon professionnel,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-100">au bon moment</span>
            </h1>
            <p className="mx-auto mt-4 sm:mt-6 lg:mt-8 max-w-2xl text-base sm:text-lg lg:text-xl leading-relaxed text-primary-100 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Des artisans, créatifs, consultants et prestataires de tous secteurs.
              Consultez leurs portfolios et contactez-les directement.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-6 sm:mt-8 lg:mt-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <GlassCard variant={darkMode ? 'dark' : 'default'} className="flex max-w-2xl flex-col sm:flex-row items-center gap-2 sm:gap-3 p-2">
                <GlassInput
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quel service recherchez-vous ?"
                  variant={darkMode ? 'dark' : 'default'}
                  icon={<Search size={20} className="text-neutral-400" />}
                  className="flex-1"
                />
                <button type="submit" className="btn-primary rounded-xl sm:rounded-2xl px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                  Rechercher
                  <ArrowRight size={18} className="hidden sm:inline" />
                </button>
              </GlassCard>
            </form>

            <div className="mt-6 sm:mt-8 lg:mt-10 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 sm:gap-y-3 gap-y-2 text-xs sm:text-sm text-primary-100 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm"><ShieldCheck size={14} className="sm:hidden" /><ShieldCheck size={18} className="hidden sm:inline" /> Profils vérifiés</span>
              <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm"><MessageSquare size={14} className="sm:hidden" /><MessageSquare size={18} className="hidden sm:inline" /> Messagerie intégrée</span>
              <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm"><Star size={14} className="sm:hidden" /><Star size={18} className="hidden sm:inline" /> Avis clients réels</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Explorez par secteur</h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-neutral-600">Trouvez le professionnel adapté à votre besoin</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {displayedCategories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/search?category=${cat.slug}`}
                className="group flex flex-col items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-neutral-200 bg-white hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <div className="flex h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 transition-all group-hover:scale-110 group-hover:from-primary-100 group-hover:to-primary-200">
                  <CategoryIcon name={cat.icon ?? ''} size={20} className="sm:hidden" />
                  <CategoryIcon name={cat.icon ?? ''} size={28} className="hidden sm:block" />
                </div>
                <div className="min-w-0 mt-2 sm:mt-3 text-center">
                  <p className="truncate text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-primary-700">{cat.name}</p>
                  <p className="truncate text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1">{cat.subcategories.length} spécialités</p>
                </div>
              </Link>
            ))}
          </div>

          {categoryTaxonomy.length > 12 && (
            <div className="text-center mt-6 sm:mt-8">
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="btn-secondary text-sm sm:text-base"
              >
                {showAllCategories ? 'Voir moins' : `Voir tous les ${categoryTaxonomy.length} secteurs`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Providers */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Prestataires en vedette</h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-neutral-600">Des professionnels de qualité, prêts à vous accompagner</p>
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
            <div className="text-center py-12 sm:py-16">
              <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-neutral-100">
                <Search size={28} className="sm:hidden text-neutral-400" />
                <Search size={32} className="hidden sm:block text-neutral-400" />
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

      {/* Testimonials */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Ce que disent nos utilisateurs</h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-neutral-600">Des témoignages authentiques de notre communauté</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="card p-4 sm:p-6">
              <div className="flex items-center gap-1 mb-3 sm:mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} className="sm:hidden fill-warning-400 text-warning-400" />
                ))}
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={`desktop-${star}`} size={16} className="hidden sm:block fill-warning-400 text-warning-400" />
                ))}
              </div>
              <Quote className="text-primary-300 mb-3 sm:mb-4" size={24} className="sm:hidden" />
              <Quote className="text-primary-300 mb-4" size={32} className="hidden sm:block" />
              <p className="text-sm sm:text-base text-neutral-700 mb-3 sm:mb-4">
                "J'ai trouvé un photographe professionnel en moins de 24h. Le processus était simple et la qualité du travail exceptionnelle."
              </p>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                  ML
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-sm sm:text-base">Marie Laurent</p>
                  <p className="text-xs sm:text-sm text-neutral-500">Entrepreneure</p>
                </div>
              </div>
            </div>

            <div className="card p-4 sm:p-6">
              <div className="flex items-center gap-1 mb-3 sm:mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} className="sm:hidden fill-warning-400 text-warning-400" />
                ))}
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={`desktop-${star}`} size={16} className="hidden sm:block fill-warning-400 text-warning-400" />
                ))}
              </div>
              <Quote className="text-primary-300 mb-3 sm:mb-4" size={24} className="sm:hidden" />
              <Quote className="text-primary-300 mb-4" size={32} className="hidden sm:block" />
              <p className="text-sm sm:text-base text-neutral-700 mb-3 sm:mb-4">
                "En tant que développeur freelance, cette plateforme m'a permis de trouver des clients sérieux et de construire mon portfolio."
              </p>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                  TD
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-sm sm:text-base">Thomas Dubois</p>
                  <p className="text-xs sm:text-sm text-neutral-500">Développeur Web</p>
                </div>
              </div>
            </div>

            <div className="card p-4 sm:p-6">
              <div className="flex items-center gap-1 mb-3 sm:mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} className="sm:hidden fill-warning-400 text-warning-400" />
                ))}
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={`desktop-${star}`} size={16} className="hidden sm:block fill-warning-400 text-warning-400" />
                ))}
              </div>
              <Quote className="text-primary-300 mb-3 sm:mb-4" size={24} className="sm:hidden" />
              <Quote className="text-primary-300 mb-4" size={32} className="hidden sm:block" />
              <p className="text-sm sm:text-base text-neutral-700 mb-3 sm:mb-4">
                "La messagerie intégrée facilite vraiment la communication. J'ai pu échanger avec plusieurs prestataires avant de choisir."
              </p>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                  SM
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-sm sm:text-base">Sophie Martin</p>
                  <p className="text-xs sm:text-sm text-neutral-500">Chef de projet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Pourquoi choisir SERVIO ?</h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-neutral-600">Une plateforme pensée pour simplifier vos collaborations</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="card p-4 sm:p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 mb-3 sm:mb-4">
                <ShieldCheck size={24} className="sm:hidden" />
                <ShieldCheck size={32} className="hidden sm:block" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1 sm:mb-2 text-sm sm:text-base">Profils vérifiés</h3>
              <p className="text-xs sm:text-sm text-neutral-600">Tous nos prestataires sont vérifiés pour garantir leur professionnalisme.</p>
            </div>

            <div className="card p-4 sm:p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-accent-50 to-accent-100 text-accent-600 mb-3 sm:mb-4">
                <MessageSquare size={24} className="sm:hidden" />
                <MessageSquare size={32} className="hidden sm:block" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1 sm:mb-2 text-sm sm:text-base">Messagerie intégrée</h3>
              <p className="text-xs sm:text-sm text-neutral-600">Communiquez directement avec les prestataires sans quitter la plateforme.</p>
            </div>

            <div className="card p-4 sm:p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-success-50 to-success-100 text-success-600 mb-3 sm:mb-4">
                <Star size={24} className="sm:hidden" />
                <Star size={32} className="hidden sm:block" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1 sm:mb-2 text-sm sm:text-base">Avis authentiques</h3>
              <p className="text-xs sm:text-sm text-neutral-600">Consultez les avis clients réels pour faire le meilleur choix.</p>
            </div>

            <div className="card p-4 sm:p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-warning-50 to-warning-100 text-warning-600 mb-3 sm:mb-4">
                <Clock size={24} className="sm:hidden" />
                <Clock size={32} className="hidden sm:block" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1 sm:mb-2 text-sm sm:text-base">Réponse rapide</h3>
              <p className="text-xs sm:text-sm text-neutral-600">Nos prestataires s'engagent à répondre dans les 24 heures.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Commencez en 3 étapes</h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-neutral-600">Simple et rapide, pas besoin d'expérience technique</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="relative">
              <div className="card p-5 sm:p-8 relative z-10">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary-600 text-white text-base sm:text-xl font-bold mb-3 sm:mb-4">
                  1
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1 sm:mb-2 text-sm sm:text-base">Créez votre compte</h3>
                <p className="text-xs sm:text-sm text-neutral-600 mb-3 sm:mb-4">Inscription gratuite en 2 minutes. Juste votre email et quelques informations de base.</p>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-neutral-600">
                  <li className="flex items-center gap-2">
                    <Check size={12} className="sm:hidden text-success-500" />
                    <Check size={16} className="hidden sm:block text-success-500" />
                    Inscription gratuite
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="sm:hidden text-success-500" />
                    <Check size={16} className="hidden sm:block text-success-500" />
                    Vérification email
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="sm:hidden text-success-500" />
                    <Check size={16} className="hidden sm:block text-success-500" />
                    Profil personnalisable
                  </li>
                </ul>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 z-20">
                <ChevronRight size={28} className="text-primary-300" />
              </div>
            </div>

            <div className="relative">
              <div className="card p-5 sm:p-8 relative z-10">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary-600 text-white text-base sm:text-xl font-bold mb-3 sm:mb-4">
                  2
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1 sm:mb-2 text-sm sm:text-base">Complétez votre profil</h3>
                <p className="text-xs sm:text-sm text-neutral-600 mb-3 sm:mb-4">Ajoutez vos compétences, portfolio et disponibilités pour attirer les clients.</p>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-neutral-600">
                  <li className="flex items-center gap-2">
                    <Check size={12} className="sm:hidden text-success-500" />
                    <Check size={16} className="hidden sm:block text-success-500" />
                    Portfolio photo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="sm:hidden text-success-500" />
                    <Check size={16} className="hidden sm:block text-success-500" />
                    Compétences et certifications
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="sm:hidden text-success-500" />
                    <Check size={16} className="hidden sm:block text-success-500" />
                    Calendrier de disponibilité
                  </li>
                </ul>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 z-20">
                <ChevronRight size={28} className="text-primary-300" />
              </div>
            </div>

            <div className="card p-5 sm:p-8">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary-600 text-white text-base sm:text-xl font-bold mb-3 sm:mb-4">
                3
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1 sm:mb-2 text-sm sm:text-base">Recevez des demandes</h3>
              <p className="text-xs sm:text-sm text-neutral-600 mb-3 sm:mb-4">Les clients vous contactent directement via la messagerie intégrée.</p>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-neutral-600">
                <li className="flex items-center gap-2">
                  <Check size={12} className="sm:hidden text-success-500" />
                  <Check size={16} className="hidden sm:block text-success-500" />
                  Notifications en temps réel
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="sm:hidden text-success-500" />
                  <Check size={16} className="hidden sm:block text-success-500" />
                  Messagerie sécurisée
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="sm:hidden text-success-500" />
                  <Check size={16} className="hidden sm:block text-success-500" />
                  Gestion des devis
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Bento Grid */}
      <BentoSection className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        <BentoGrid>
          <BentoCard colSpan={2} variant="gradient" className="flex flex-col justify-center text-center p-4 sm:p-6">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white backdrop-blur-sm mb-4 sm:mb-6 mx-auto w-fit">
              <Sparkles size={14} className="sm:hidden" />
              <Sparkles size={16} className="hidden sm:block" />
              Rejoignez notre communauté
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">Vous êtes prestataire de services ?</h2>
            <p className="mx-auto mt-3 sm:mt-4 lg:mt-6 max-w-2xl text-base sm:text-lg lg:text-xl text-primary-100">
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
