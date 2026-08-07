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

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-2 text-sm font-medium text-white backdrop-blur-md border border-white/20 animate-fade-in">
              <Sparkles size={18} className="text-primary-200" />
              La plateforme des prestataires de services
            </div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl animate-slide-up">
              Trouvez le bon professionnel,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-100">au bon moment</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-primary-100 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Des artisans, créatifs, consultants et prestataires de tous secteurs.
              Consultez leurs portfolios et contactez-les directement.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <GlassCard variant={darkMode ? 'dark' : 'default'} className="flex max-w-2xl items-center gap-3 p-2">
                <GlassInput
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quel service recherchez-vous ?"
                  variant={darkMode ? 'dark' : 'default'}
                  icon={<Search size={22} className="text-neutral-400" />}
                />
                <button type="submit" className="btn-primary rounded-2xl px-8 py-4">
                  Rechercher
                  <ArrowRight size={20} />
                </button>
              </GlassCard>
            </form>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-base text-primary-100 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm"><ShieldCheck size={18} /> Profils vérifiés</span>
              <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm"><MessageSquare size={18} /> Messagerie intégrée</span>
              <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm"><Star size={18} /> Avis clients réels</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900">Explorez par secteur</h2>
            <p className="mt-3 text-lg text-neutral-600">Trouvez le professionnel adapté à votre besoin</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {displayedCategories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/search?category=${cat.slug}`}
                className="group flex flex-col items-center p-4 rounded-2xl border border-neutral-200 bg-white hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 transition-all group-hover:scale-110 group-hover:from-primary-100 group-hover:to-primary-200">
                  <CategoryIcon name={cat.icon ?? ''} size={28} />
                </div>
                <div className="min-w-0 mt-3">
                  <p className="truncate text-sm font-bold text-neutral-900 group-hover:text-primary-700">{cat.name}</p>
                  <p className="truncate text-xs text-neutral-500 mt-1">{cat.subcategories.length} spécialités</p>
                </div>
              </Link>
            ))}
          </div>

          {categoryTaxonomy.length > 12 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="btn-secondary"
              >
                {showAllCategories ? 'Voir moins' : `Voir tous les ${categoryTaxonomy.length} secteurs`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Providers */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900">Prestataires en vedette</h2>
            <p className="mt-3 text-lg text-neutral-600">Des professionnels de qualité, prêts à vous accompagner</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-in">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-96 animate-pulse overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-neutral-200 to-neutral-300" />
                  <div className="p-6">
                    <div className="h-5 w-3/4 rounded bg-neutral-200" />
                    <div className="mt-3 h-4 w-1/2 rounded bg-neutral-200" />
                    <div className="mt-4 h-4 w-2/3 rounded bg-neutral-200" />
                    <div className="mt-4 h-4 w-1/2 rounded bg-neutral-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-in">
              {featured.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <Search size={32} className="text-neutral-400" />
              </div>
              <p className="text-lg text-neutral-600">Aucun prestataire disponible pour le moment.</p>
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
      <section className="py-20 bg-gradient-to-b from-white to-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900">Ce que disent nos utilisateurs</h2>
            <p className="mt-3 text-lg text-neutral-600">Des témoignages authentiques de notre communauté</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-6">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={16} className="fill-warning-400 text-warning-400" />
                ))}
              </div>
              <Quote className="text-primary-300 mb-4" size={32} />
              <p className="text-neutral-700 mb-4">
                "J'ai trouvé un photographe professionnel en moins de 24h. Le processus était simple et la qualité du travail exceptionnelle."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                  ML
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Marie Laurent</p>
                  <p className="text-sm text-neutral-500">Entrepreneure</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={16} className="fill-warning-400 text-warning-400" />
                ))}
              </div>
              <Quote className="text-primary-300 mb-4" size={32} />
              <p className="text-neutral-700 mb-4">
                "En tant que développeur freelance, cette plateforme m'a permis de trouver des clients sérieux et de construire mon portfolio."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-semibold">
                  TD
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Thomas Dubois</p>
                  <p className="text-sm text-neutral-500">Développeur Web</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={16} className="fill-warning-400 text-warning-400" />
                ))}
              </div>
              <Quote className="text-primary-300 mb-4" size={32} />
              <p className="text-neutral-700 mb-4">
                "La messagerie intégrée facilite vraiment la communication. J'ai pu échanger avec plusieurs prestataires avant de choisir."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center text-white font-semibold">
                  SM
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Sophie Martin</p>
                  <p className="text-sm text-neutral-500">Chef de projet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900">Pourquoi choisir SERVIO ?</h2>
            <p className="mt-3 text-lg text-neutral-600">Une plateforme pensée pour simplifier vos collaborations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Profils vérifiés</h3>
              <p className="text-sm text-neutral-600">Tous nos prestataires sont vérifiés pour garantir leur professionnalisme.</p>
            </div>

            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-50 to-accent-100 text-accent-600 mb-4">
                <MessageSquare size={32} />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Messagerie intégrée</h3>
              <p className="text-sm text-neutral-600">Communiquez directement avec les prestataires sans quitter la plateforme.</p>
            </div>

            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-success-50 to-success-100 text-success-600 mb-4">
                <Star size={32} />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Avis authentiques</h3>
              <p className="text-sm text-neutral-600">Consultez les avis clients réels pour faire le meilleur choix.</p>
            </div>

            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-warning-50 to-warning-100 text-warning-600 mb-4">
                <Clock size={32} />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Réponse rapide</h3>
              <p className="text-sm text-neutral-600">Nos prestataires s'engagent à répondre dans les 24 heures.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900">Commencez en 3 étapes</h2>
            <p className="mt-3 text-lg text-neutral-600">Simple et rapide, pas besoin d'expérience technique</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="card p-8 relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">Créez votre compte</h3>
                <p className="text-sm text-neutral-600 mb-4">Inscription gratuite en 2 minutes. Juste votre email et quelques informations de base.</p>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-success-500" />
                    Inscription gratuite
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-success-500" />
                    Vérification email
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-success-500" />
                    Profil personnalisable
                  </li>
                </ul>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 z-20">
                <ChevronRight size={32} className="text-primary-300" />
              </div>
            </div>

            <div className="relative">
              <div className="card p-8 relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">Complétez votre profil</h3>
                <p className="text-sm text-neutral-600 mb-4">Ajoutez vos compétences, portfolio et disponibilités pour attirer les clients.</p>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-success-500" />
                    Portfolio photo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-success-500" />
                    Compétences et certifications
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-success-500" />
                    Calendrier de disponibilité
                  </li>
                </ul>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 z-20">
                <ChevronRight size={32} className="text-primary-300" />
              </div>
            </div>

            <div className="card p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-xl mb-4">
                3
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Recevez des demandes</h3>
              <p className="text-sm text-neutral-600 mb-4">Les clients vous contactent directement via la messagerie intégrée.</p>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-success-500" />
                  Notifications en temps réel
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-success-500" />
                  Messagerie sécurisée
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-success-500" />
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
          <BentoCard colSpan={2} variant="gradient" className="flex flex-col justify-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm mb-6 mx-auto w-fit">
              <Sparkles size={16} />
              Rejoignez notre communauté
            </div>
            <h2 className="text-4xl font-bold text-white sm:text-5xl">Vous êtes prestataire de services ?</h2>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-primary-100">
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
