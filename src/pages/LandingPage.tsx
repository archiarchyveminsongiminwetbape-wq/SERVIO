import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles, ShieldCheck, MessageSquare, Star, Users, Award, Clock, Quote, Check, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDarkMode } from '@/context/DarkModeContext';
import { useI18n } from '@/context/I18nContext';
import type { Category, ProviderProfile } from '@/types';
import ProviderCard from '@/components/ProviderCard';
import CategoryIcon from '@/components/CategoryIcon';
import { BentoGrid, BentoCard, BentoSection } from '@/components/BentoGrid';
import { BentoStatCard, BentoFeatureCard, BentoActionCard } from '@/components/BentoCard';
import { GlassCard, GlassInput } from '@/components/GlassCard';
import { categoryTaxonomy } from '@/data/categories';

export default function LandingPage() {
  const { t } = useI18n();
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
        .select('id, user_id, business_name, headline, avatar_url, banner_url, city, country, remote_service, skills, badges, rating_avg, rating_count, price_range, availability, slug, category_id, category_slug, experience_years, languages, validation_status, is_featured, description, website, phone, email, social_links, response_time_hours, created_at, category:categories(id, name, slug)')
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

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16 md:py-20 lg:py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 sm:mb-6 md:mb-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white backdrop-blur-md border border-white/20 animate-fade-in">
              <Sparkles size={14} className="sm:hidden" />
              <Sparkles size={16} className="hidden sm:block" />
              {t.landing.platformBadge}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-white animate-slide-up">
              {t.landing.heroTitle}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-100">{t.landing.heroSubtitle}</span>
            </h1>
            <p className="mx-auto mt-3 sm:mt-4 md:mt-6 lg:mt-8 max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-primary-100 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {t.landing.heroDescription}
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-4 sm:mt-6 md:mt-8 lg:mt-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <GlassCard variant={darkMode ? 'dark' : 'default'} className="flex max-w-2xl flex-col sm:flex-row items-center gap-2 sm:gap-3 p-2">
                <GlassInput
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.search.placeholder}
                  variant={darkMode ? 'dark' : 'default'}
                  icon={<Search size={18} className="sm:hidden" />}
                  iconDesktop={<Search size={20} className="hidden sm:block" />}
                  className="flex-1"
                />
                <button type="submit" className="btn-primary rounded-xl sm:rounded-2xl px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 w-full sm:w-auto text-sm sm:text-base">
                  {t.common.search}
                  <ArrowRight size={16} className="hidden sm:inline" />
                </button>
              </GlassCard>
            </form>

            <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-10 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-2 sm:gap-y-3 text-xs sm:text-sm text-primary-100 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full backdrop-blur-sm"><ShieldCheck size={12} className="sm:hidden" /><ShieldCheck size={14} className="sm:hidden" /><ShieldCheck size={18} className="hidden md:inline" /> {t.landing.verifiedProfiles}</span>
              <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm"><MessageSquare size={14} className="sm:hidden" /><MessageSquare size={18} className="hidden sm:inline" /> {t.landing.integratedMessaging}</span>
              <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm"><Star size={14} className="sm:hidden" /><Star size={18} className="hidden sm:inline" /> {t.landing.realReviews}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t.landing.exploreBySector}</h2>
              <p className="mt-2 text-sm sm:text-base lg:text-lg text-neutral-600">{t.landing.findRightProfessional}</p>
            </div>
            <Link to="/search" className="btn-secondary text-sm sm:text-base">
              Voir tous les secteurs
              <ArrowRight size={16} className="hidden sm:inline ml-2" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {displayedCategories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/search?category=${cat.slug}`}
                className="group flex flex-col items-center p-4 rounded-2xl border border-neutral-200 bg-white hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 transition-all group-hover:scale-110 group-hover:from-primary-100 group-hover:to-primary-200">
                  <CategoryIcon name={cat.icon ?? ''} size={28} />
                </div>
                <div className="min-w-0 mt-3 text-center">
                  <p className="truncate text-sm font-bold text-neutral-900 group-hover:text-primary-700">{cat.name}</p>
                  <p className="truncate text-xs text-neutral-500 mt-1">{cat.subcategories.length} {t.landing.specialties}</p>
                </div>
              </Link>
            ))}
          </div>

          {categoryTaxonomy.length > 12 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="btn-secondary text-sm sm:text-base"
              >
                {showAllCategories ? t.landing.seeLess : t.landing.seeAllSectors.replace('{count}', categoryTaxonomy.length.toString())}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Providers */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t.landing.featuredProviders}</h2>
              <p className="mt-2 text-sm sm:text-base lg:text-lg text-neutral-600">{t.landing.featuredProvidersSubtitle}</p>
            </div>
            <Link to="/search" className="btn-secondary text-sm sm:text-base">
              Voir tous les prestataires
              <ArrowRight size={16} className="hidden sm:inline ml-2" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card h-96 animate-pulse overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-neutral-200 to-neutral-300" />
                  <div className="p-6">
                    <div className="h-5 w-3/4 rounded bg-neutral-200 mb-3" />
                    <div className="h-4 w-1/2 rounded bg-neutral-200 mb-3" />
                    <div className="h-4 w-2/3 rounded bg-neutral-200 mb-3" />
                    <div className="h-4 w-1/2 rounded bg-neutral-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featured.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <Search size={32} className="text-neutral-400" />
              </div>
              <p className="text-lg text-neutral-600">{t.search.noResults}</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats - Bento Grid */}
      <BentoSection className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Nos statistiques</h2>
            <p className="mt-2 text-sm sm:text-base lg:text-lg text-neutral-300">Des chiffres qui parlent d'eux-mêmes</p>
          </div>
        </div>
        <BentoGrid>
          <BentoStatCard 
            icon={Users} 
            value="10K+" 
            label={t.landing.statsProviders} 
            trend="+15%" 
            variant="dark"
          />
          <BentoStatCard 
            icon={Award} 
            value="50K+" 
            label={t.landing.statsProjects} 
            trend="+23%" 
            variant="dark"
          />
          <BentoStatCard 
            icon={Star} 
            value="4.8" 
            label={t.landing.statsRating} 
            variant="dark"
          />
          <BentoStatCard 
            icon={Clock} 
            value="24h" 
            label={t.landing.statsResponseTime} 
            variant="dark"
          />
        </BentoGrid>
      </BentoSection>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t.landing.testimonialsTitle}</h2>
              <p className="mt-2 text-sm sm:text-base lg:text-lg text-neutral-600">{t.landing.testimonialsSubtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={16} className="fill-warning-400 text-warning-400" />
                ))}
              </div>
              <Quote className="text-primary-300 mb-4" size={32} />
              <p className="text-base text-neutral-700 mb-4">
                {t.landing.testimonial1}
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                  ML
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-base">{t.landing.testimonial1Name}</p>
                  <p className="text-sm text-neutral-500">{t.landing.testimonial1Role}</p>
                </div>
              </div>
            </div>

            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={16} className="fill-warning-400 text-warning-400" />
                ))}
              </div>
              <Quote className="text-primary-300 mb-4" size={32} />
              <p className="text-base text-neutral-700 mb-4">
                {t.landing.testimonial2}
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-semibold">
                  TD
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-base">{t.landing.testimonial2Name}</p>
                  <p className="text-sm text-neutral-500">{t.landing.testimonial2Role}</p>
                </div>
              </div>
            </div>

            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={16} className="fill-warning-400 text-warning-400" />
                ))}
              </div>
              <Quote className="text-primary-300 mb-4" size={32} />
              <p className="text-base text-neutral-700 mb-4">
                {t.landing.testimonial3}
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center text-white text-sm font-semibold">
                  SM
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-base">{t.landing.testimonial3Name}</p>
                  <p className="text-sm text-neutral-500">{t.landing.testimonial3Role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t.landing.whyChooseTitle}</h2>
            <p className="mt-2 text-sm sm:text-base lg:text-lg text-neutral-600">{t.landing.whyChooseSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2 text-base">{t.landing.benefit1Title}</h3>
              <p className="text-sm text-neutral-600">{t.landing.benefit1Description}</p>
            </div>

            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-50 to-accent-100 text-accent-600 mb-4">
                <MessageSquare size={32} />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2 text-base">{t.landing.benefit2Title}</h3>
              <p className="text-sm text-neutral-600">{t.landing.benefit2Description}</p>
            </div>

            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-success-50 to-success-100 text-success-600 mb-4">
                <Star size={32} />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2 text-base">{t.landing.benefit3Title}</h3>
              <p className="text-sm text-neutral-600">{t.landing.benefit3Description}</p>
            </div>

            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-warning-50 to-warning-100 text-warning-600 mb-4">
                <Clock size={32} />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2 text-base">{t.landing.benefit4Title}</h3>
              <p className="text-sm text-neutral-600">{t.landing.benefit4Description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t.landing.quickStartTitle}</h2>
            <p className="mt-2 text-sm sm:text-base lg:text-lg text-neutral-600">{t.landing.quickStartSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="card p-8 relative z-10 h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2 text-base">{t.landing.step1Title}</h3>
                <p className="text-sm text-neutral-600 mb-4">{t.landing.step1Description}</p>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-success-500 flex-shrink-0" />
                    {t.landing.step1Feature1}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-success-500 flex-shrink-0" />
                    {t.landing.step1Feature2}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-success-500 flex-shrink-0" />
                    {t.landing.step1Feature3}
                  </li>
                </ul>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 z-20">
                <ChevronRight size={28} className="text-primary-300" />
              </div>
            </div>

            <div className="relative">
              <div className="card p-8 relative z-10 h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2 text-base">{t.landing.step2Title}</h3>
                <p className="text-sm text-neutral-600 mb-4">{t.landing.step2Description}</p>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-success-500 flex-shrink-0" />
                    {t.landing.step2Feature1}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-success-500 flex-shrink-0" />
                    {t.landing.step2Feature2}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-success-500 flex-shrink-0" />
                    {t.landing.step2Feature3}
                  </li>
                </ul>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 z-20">
                <ChevronRight size={28} className="text-primary-300" />
              </div>
            </div>

            <div className="card p-8 h-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white text-xl font-bold mb-4">
                3
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2 text-base">{t.landing.step3Title}</h3>
              <p className="text-sm text-neutral-600 mb-4">{t.landing.step3Description}</p>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-success-500 flex-shrink-0" />
                  {t.landing.step3Feature1}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-success-500 flex-shrink-0" />
                  {t.landing.step3Feature2}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-success-500 flex-shrink-0" />
                  {t.landing.step3Feature3}
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
              {t.landing.ctaBadge}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">{t.landing.ctaTitle}</h2>
            <p className="mx-auto mt-3 sm:mt-4 lg:mt-6 max-w-2xl text-base sm:text-lg lg:text-xl text-primary-100">
              {t.landing.ctaDescription}
            </p>
          </BentoCard>
          <BentoActionCard 
            icon={ArrowRight}
            title={t.landing.ctaButton}
            description={t.landing.ctaButtonSubtitle}
            action={t.auth.signup}
            onClick={() => navigate('/signup')}
            variant="gradient"
          />
        </BentoGrid>
      </BentoSection>
    </div>
  );
}
