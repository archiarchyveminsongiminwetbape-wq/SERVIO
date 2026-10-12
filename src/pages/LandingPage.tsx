import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles, ShieldCheck, MessageSquare, Star, Users, Award, Clock, Quote, Check, ChevronRight } from 'lucide-react';
import { useDarkMode } from '@/context/DarkModeContext';
import { useI18n } from '@/context/I18nContext';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import CategoryIcon from '@/components/CategoryIcon';
import { BentoGrid, BentoCard, BentoSection } from '@/components/BentoGrid';
import { BentoStatCard, BentoFeatureCard, BentoActionCard } from '@/components/BentoCard';
import { GlassCard, GlassInput } from '@/components/GlassCard';
import { categoryTaxonomy } from '@/data/categories';

type LandingTestimonial = {
  id: string;
  client_name: string;
  client_avatar_url: string | null;
  rating: number;
  testimonial: string;
  project_title: string | null;
};

function AnimatedStatValue({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      document.hidden ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const duration = 1050;
    let startedAt: number | null = null;

    const animate = (time: number) => {
      if (startedAt === null) startedAt = time;
      const progress = Math.min((time - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(value * easedProgress));

      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };

    setDisplayValue(0);
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className="stats-count" aria-label={value.toLocaleString()}>
      <span aria-hidden="true">{displayValue.toLocaleString()}</span>
    </span>
  );
}

export default function LandingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [liveStats, setLiveStats] = useState<{ providers: number; projects: number } | null>(null);
  const [verifiedTestimonials, setVerifiedTestimonials] = useState<LandingTestimonial[]>([]);

  const displayedCategories = showAllCategories 
    ? categoryTaxonomy 
    : categoryTaxonomy.slice(0, 12);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    let isActive = true;

    const loadPublicContent = async () => {
      try {
        const [providersResult, projectsResult, testimonialsResult] = await Promise.all([
          supabase
            .from('provider_profiles')
            .select('id', { count: 'exact', head: true })
            .eq('validation_status', 'approved'),
          supabase
            .from('portfolio_items')
            .select('id, provider:provider_profiles!inner(validation_status)', { count: 'exact', head: true })
            .eq('provider.validation_status', 'approved'),
          supabase
            .from('testimonials')
            .select('id, client_name, client_avatar_url, rating, testimonial, project_title')
            .eq('is_verified', true)
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        if (!isActive) return;

        if (!providersResult.error && !projectsResult.error) {
          setLiveStats({
            providers: providersResult.count ?? 0,
            projects: projectsResult.count ?? 0,
          });
        }

        if (!testimonialsResult.error) {
          setVerifiedTestimonials((testimonialsResult.data ?? []) as LandingTestimonial[]);
        }
      } catch (error) {
        console.error('Could not load public landing data:', error);
      }
    };

    void loadPublicContent();
    return () => {
      isActive = false;
    };
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
            alt="Arrière-plan SERVIO - Plateforme de services"
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 via-primary-900/30 to-transparent" />

        <div className="orb left-[-80px] top-20 h-48 w-48 bg-primary-400/25" />
        <div className="orb right-[-80px] bottom-20 h-52 w-52 bg-cyan-300/20" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16 md:py-20 lg:py-24 sm:px-6 lg:px-8">
          <div className="hero-3d-shell grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="mx-auto max-w-4xl text-center lg:text-left">
              <div className="mb-4 sm:mb-6 md:mb-8 flex items-center justify-center lg:justify-start gap-3">
                <img 
                  src="/images/servio-logo.png" 
                  alt="SERVIO Logo" 
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-cover shadow-lg"
                />
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white backdrop-blur-md border border-white/20 animate-fade-in">
                  <Sparkles size={14} className="sm:hidden" />
                  <Sparkles size={16} className="hidden sm:block" />
                  {t.landing.platformBadge}
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-white animate-slide-up">
                {t.landing.heroTitle}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-100">{t.landing.heroSubtitle}</span>
              </h1>
              <p className="mx-auto mt-3 sm:mt-4 md:mt-6 lg:mt-8 max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-primary-100 animate-slide-up lg:mx-0" style={{ animationDelay: '0.1s' }}>
                {t.landing.heroDescription}
              </p>

              <form onSubmit={handleSearch} className="mx-auto mt-4 sm:mt-6 md:mt-8 lg:mt-12 animate-slide-up lg:mx-0" style={{ animationDelay: '0.2s' }}>
                <GlassCard variant={darkMode ? 'dark' : 'default'} className="hero-3d-card flex max-w-2xl flex-col sm:flex-row items-center gap-2 sm:gap-3 p-2">
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

              <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-10 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-2 sm:gap-y-3 text-xs sm:text-sm text-primary-100 animate-slide-up lg:justify-start" style={{ animationDelay: '0.3s' }}>
                <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full backdrop-blur-sm"><ShieldCheck size={12} className="sm:hidden" /><ShieldCheck size={14} className="sm:hidden" /><ShieldCheck size={18} className="hidden md:inline" /> {t.landing.verifiedProfiles}</span>
                <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm"><MessageSquare size={14} className="sm:hidden" /><MessageSquare size={18} className="hidden sm:inline" /> {t.landing.integratedMessaging}</span>
                <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm"><Star size={14} className="sm:hidden" /><Star size={18} className="hidden sm:inline" /> {t.landing.realReviews}</span>
              </div>

            </div>

            <div className="hidden lg:block">
              <div className="floating-panel delay-1 relative mx-auto w-[92%] max-w-md rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-md">
                <h2 className="text-sm font-semibold text-primary-100">{t.landing.exploreBySector}</h2>
                <div className="mt-4 divide-y divide-white/15">
                  {categoryTaxonomy.slice(0, 3).map((category) => (
                    <Link
                      key={category.slug}
                      to={`/search?category=${category.slug}`}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:text-primary-100"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-primary-100">
                        <CategoryIcon name={category.icon ?? ''} size={21} />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">{category.name}</span>
                      <ArrowRight size={17} className="shrink-0 text-primary-200" />
                    </Link>
                  ))}
                </div>
                <Link to="/search" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-primary-100">
                  {t.landing.seeAllSectors.replace('{count}', categoryTaxonomy.length.toString())}
                  <ArrowRight size={16} />
                </Link>
              </div>
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

      {liveStats && (
      <BentoSection className="stats-section bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
          <div className="stats-heading text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase text-primary-200">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              SERVIO · En chiffres
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Nos statistiques</h2>
            <p className="mt-2 text-sm sm:text-base lg:text-lg text-neutral-300">Données issues des profils et portfolios publiés</p>
          </div>
        </div>
        <BentoGrid className="stats-grid mx-auto max-w-4xl">
          <div className="stats-card-reveal">
            <BentoStatCard
              icon={Users}
              value={<AnimatedStatValue value={liveStats.providers} />}
              label={t.landing.statsProviders}
              variant="dark"
            />
          </div>
          <div className="stats-card-reveal">
            <BentoStatCard
              icon={Award}
              value={<AnimatedStatValue value={liveStats.projects} />}
              label={t.landing.statsProjects}
              variant="dark"
            />
          </div>
        </BentoGrid>
      </BentoSection>
      )}

      {/* Testimonials */}
      {verifiedTestimonials.length > 0 && (
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t.landing.testimonialsTitle}</h2>
              <p className="mt-2 text-sm sm:text-base lg:text-lg text-neutral-600">{t.landing.testimonialsSubtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {verifiedTestimonials.map((item) => (
              <article key={item.id} className="card p-6">
                <div className="flex items-center gap-1 mb-4" aria-label={`${item.rating} sur 5`}>
                  {Array.from({ length: item.rating }, (_, index) => (
                    <Star key={index} size={16} className="fill-warning-400 text-warning-400" />
                  ))}
                </div>
                <Quote className="text-primary-300 mb-4" size={32} />
                <p className="text-base text-neutral-700">{item.testimonial}</p>
                <div className="mt-5 flex items-center gap-3">
                  {item.client_avatar_url ? (
                    <img src={item.client_avatar_url} alt="" loading="lazy" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                      {item.client_name.trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-neutral-900">{item.client_name}</p>
                    {item.project_title && <p className="truncate text-sm text-neutral-500">{item.project_title}</p>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

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
