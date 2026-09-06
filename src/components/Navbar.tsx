import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, memo, useEffect } from 'react';
import { Menu, X, MessageSquare, Heart, LayoutDashboard, Shield, LogOut, User, Briefcase, Settings, UserCircle, Moon, Sun, Globe, ChevronDown, Crown, Sparkles, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useI18n } from '@/context/I18nContext';
import NotificationBell from '@/components/NotificationBell';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { language, setLanguage, supportedLanguages, t, isRTL } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
  const isInstallSupported = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const showInstallButton = isInstallSupported && !isStandalone;

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }

    setInstallHelpOpen(true);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileOpen(false);
  };

  const dashboardLink = () => {
    if (!profile) return '/login';
    if (profile.role === 'admin') return '/admin';
    if (profile.role === 'provider') return '/provider/dashboard';
    return '/favorites';
  };

  return (
    <>
      <nav className={`sticky top-0 z-50 border-b ${darkMode ? 'border-white/10 bg-slate-950/70 backdrop-blur-xl' : 'border-primary-100/60 bg-white/75 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]'}`} role="navigation" aria-label={t.nav.home} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 sm:gap-8">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl font-bold tracking-tight" aria-label="SERVIO - Accueil">
            <img 
              src="/images/servio-logo.png" 
              alt="SERVIO Logo" 
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl object-cover shadow-lg"
            />
            <span className={darkMode ? 'text-white' : 'text-neutral-900'}>SERVIO</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              className={`rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                isActive('/') 
                  ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100' 
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
              aria-current={isActive('/') ? 'page' : undefined}
            >
              {t.nav.home}
            </Link>
            <Link
              to="/search"
              className={`rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                isActive('/search') 
                  ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100' 
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
              aria-current={isActive('/search') ? 'page' : undefined}
            >
              {t.nav.search}
            </Link>
            {profile?.role === 'provider' && (
              <>
                <Link
                  to="/provider/dashboard"
                  className={`rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                    isActive('/provider/dashboard') 
                      ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100' 
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                  aria-current={isActive('/provider/dashboard') ? 'page' : undefined}
                >
                  {t.provider.dashboard}
                </Link>
                <Link
                  to="/subscription"
                  className={`rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                    isActive('/subscription') 
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 ring-1 ring-amber-200' 
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                  aria-current={isActive('/subscription') ? 'page' : undefined}
                >
                  <Crown size={14} className="inline mr-1" />
                  Premium
                </Link>
              </>
            )}
            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className={`rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  isActive('/admin') 
                    ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100' 
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
                aria-current={isActive('/admin') ? 'page' : undefined}
              >
                {t.admin.dashboard}
              </Link>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to="/messages"
                className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                aria-label={t.user.messages}
              >
                <MessageSquare size={18} className="sm:hidden" />
                <MessageSquare size={20} className="hidden sm:block" />
              </Link>
              <Link
                to="/favorites"
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}
                aria-label={t.user.favorites}
              >
                <Heart size={18} className="sm:hidden" />
                <Heart size={20} className="hidden sm:block" />
              </Link>
              <Link
                to="/recommendations"
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}
                aria-label="Recommandations"
              >
                <Sparkles size={18} className="sm:hidden" />
                <Sparkles size={20} className="hidden sm:block" />
              </Link>
              <NotificationBell />
              
              {showInstallButton && (
                <button
                  onClick={handleInstallApp}
                  className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100"
                  aria-label="Installer l’application"
                >
                  <Download size={16} />
                  <span className="hidden xl:inline">Installer</span>
                </button>
              )}

              <button
                onClick={toggleDarkMode}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}
                aria-label={darkMode ? t.common.light : t.common.dark}
              >
                {darkMode ? (
                  <>
                    <Sun size={18} className="sm:hidden" />
                    <Sun size={20} className="hidden sm:block" />
                  </>
                ) : (
                  <>
                    <Moon size={18} className="sm:hidden" />
                    <Moon size={20} className="hidden sm:block" />
                  </>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-100"
                  aria-expanded={langMenuOpen}
                  aria-haspopup="true"
                  aria-label={t.user.language}
                >
                  <Globe size={16} />
                  <span className="text-sm font-medium text-neutral-700">
                    {supportedLanguages.find(l => l.code === language)?.flag}
                  </span>
                  <ChevronDown size={14} className="text-neutral-400" />
                </button>

                {langMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setLangMenuOpen(false)} />
                    <div className={`${isRTL ? 'left-0' : 'right-0'} top-12 z-20 w-48 animate-slide-down rounded-xl border border-neutral-200 bg-white py-2 shadow-lg absolute`} role="menu">
                      {supportedLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { setLanguage(lang.code); setLangMenuOpen(false); }}
                          className={`flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-50 ${
                            language === lang.code ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                          }`}
                          role="menuitem"
                          aria-label={`${t.user.language}: ${lang.name}`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-neutral-100"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label={t.user.profile}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                      {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-neutral-700">
                    {profile?.full_name?.split(' ')[0] ?? 'Profil'}
                  </span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className={`${isRTL ? 'left-0' : 'right-0'} top-12 z-20 w-56 animate-slide-down rounded-xl border border-neutral-200 bg-white py-2 shadow-lg absolute`} role="menu">
                      <Link
                        to={dashboardLink()}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        role="menuitem"
                      >
                        {profile?.role === 'admin' ? <Shield size={16} /> : <LayoutDashboard size={16} />}
                        {t.nav.dashboard}
                      </Link>
                      <Link
                        to="/favorites"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        role="menuitem"
                      >
                        <Heart size={16} />
                        {t.nav.myFavorites}
                      </Link>
                      <Link
                        to="/messages"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        role="menuitem"
                      >
                        <MessageSquare size={16} />
                        {t.nav.messages}
                      </Link>
                      <Link
                        to="/notifications"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        role="menuitem"
                      >
                        <MessageSquare size={16} />
                        {t.nav.notifications}
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        role="menuitem"
                      >
                        <UserCircle size={16} />
                        {t.nav.myProfile}
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        role="menuitem"
                      >
                        <Settings size={16} />
                        {t.nav.settings}
                      </Link>
                      <div className="my-1 border-t border-neutral-100" />
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50"
                        role="menuitem"
                      >
                        <LogOut size={16} />
                        {t.nav.logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-100"
                  aria-expanded={langMenuOpen}
                  aria-haspopup="true"
                  aria-label={t.nav.changeLanguage}
                >
                  <Globe size={16} />
                  <span className="text-sm font-medium text-neutral-700">
                    {supportedLanguages.find(l => l.code === language)?.flag}
                  </span>
                  <ChevronDown size={14} className="text-neutral-400" />
                </button>

                {langMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setLangMenuOpen(false)} />
                    <div className="absolute right-0 top-12 z-20 w-48 animate-slide-down rounded-xl border border-neutral-200 bg-white py-2 shadow-lg" role="menu">
                      {supportedLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { setLanguage(lang.code); setLangMenuOpen(false); }}
                          className={`flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-50 ${
                            language === lang.code ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                          }`}
                          role="menuitem"
                          aria-label={`${t.nav.changeLanguageTo.replace('{lang}', lang.name)}`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {showInstallButton && (
                <button
                  onClick={handleInstallApp}
                  className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100"
                  aria-label="Installer l’application"
                >
                  <Download size={16} />
                  Installer
                </button>
              )}
              <Link to="/login" className="btn-ghost" aria-label={t.nav.login}>
                <User size={18} />
                {t.nav.login}
              </Link>
              <Link to="/signup" className="btn-primary">
                {t.nav.signup}
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-neutral-600 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t.nav.closeMenu : t.nav.openMenu}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <>
              <X size={20} className="sm:hidden" />
              <X size={22} className="hidden sm:block" />
            </>
          ) : (
            <>
              <Menu size={20} className="sm:hidden" />
              <Menu size={22} className="hidden sm:block" />
            </>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 py-4 md:hidden" role="menu">
          <div className="flex flex-col gap-1">
            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3 text-base font-medium text-neutral-700 rounded-lg hover:bg-neutral-100 px-3" role="menuitem">
              <Briefcase size={20} />
              {t.nav.home}
            </Link>
            <Link to="/search" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3 text-base font-medium text-neutral-700 rounded-lg hover:bg-neutral-100 px-3" role="menuitem">
              <Briefcase size={20} />
              {t.nav.explore}
            </Link>
            {user ? (
              <>
                {showInstallButton && (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleInstallApp();
                    }}
                    className="flex items-center gap-3 py-3 text-base font-medium text-primary-700 rounded-lg hover:bg-primary-50 px-3 w-full text-left"
                    role="menuitem"
                  >
                    <Download size={20} />
                    Installer l’application
                  </button>
                )}
                <Link to="/messages" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3 text-base font-medium text-neutral-700 rounded-lg hover:bg-neutral-100 px-3" role="menuitem">
                  <MessageSquare size={20} />
                  {t.nav.messages}
                </Link>
                <Link to="/favorites" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3 text-base font-medium text-neutral-700 rounded-lg hover:bg-neutral-100 px-3" role="menuitem">
                  <Heart size={20} />
                  {t.nav.myFavorites}
                </Link>
                <Link to="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3 text-base font-medium text-neutral-700 rounded-lg hover:bg-neutral-100 px-3" role="menuitem">
                  <MessageSquare size={20} />
                  {t.nav.notifications}
                </Link>
                <Link to={dashboardLink()} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3 text-base font-medium text-neutral-700 rounded-lg hover:bg-neutral-100 px-3" role="menuitem">
                  <LayoutDashboard size={20} />
                  {t.nav.dashboard}
                </Link>
                <div className="border-t border-neutral-200 my-2" />
                <button onClick={handleSignOut} className="flex items-center gap-3 py-3 text-base font-medium text-error-600 rounded-lg hover:bg-error-50 px-3 w-full text-left" role="menuitem">
                  <LogOut size={20} />
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                {showInstallButton && (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleInstallApp();
                    }}
                    className="flex items-center justify-center gap-2 py-3 text-base font-medium text-primary-700 rounded-lg hover:bg-primary-50 px-3 w-full"
                    role="menuitem"
                  >
                    <Download size={20} />
                    Installer l’application
                  </button>
                )}
                <div className="border-t border-neutral-200 my-2" />
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 py-3 text-base font-medium text-primary-600 rounded-lg hover:bg-primary-50 px-3" role="menuitem">
                  <User size={20} />
                  {t.nav.login}
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 px-3" role="menuitem">
                  {t.nav.signup}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      </nav>

      {showInstallButton && (
        <div className="sticky top-16 z-40 border-b border-primary-200/80 bg-primary-600 px-4 py-2.5 shadow-lg md:hidden">
          <button
            onClick={handleInstallApp}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-primary-700 shadow-md transition-transform active:scale-[0.98]"
            aria-label="Installer SERVIO sur le téléphone"
          >
            <Download size={19} strokeWidth={2.5} />
            Installer SERVIO sur le téléphone
          </button>
        </div>
      )}

      {installHelpOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-4 md:items-center" role="dialog" aria-modal="true" aria-labelledby="install-help-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="install-help-title" className="text-lg font-bold text-slate-900">Installer SERVIO</h2>
                <p className="mt-1 text-sm text-slate-600">Votre navigateur ne peut pas ouvrir l’installation automatiquement.</p>
              </div>
              <button onClick={() => setInstallHelpOpen(false)} className="rounded-lg px-2 py-1 text-xl text-slate-500" aria-label="Fermer">&times;</button>
            </div>
            <div className="mt-4 rounded-xl bg-primary-50 p-4 text-sm text-primary-900">
              {/iPhone|iPad|iPod/i.test(navigator.userAgent) ? (
                <><strong>iPhone / iPad :</strong> touchez <strong>Partager</strong>, puis <strong>Sur l’écran d’accueil</strong>.</>
              ) : (
                <><strong>Android :</strong> touchez le menu <strong>⋮</strong> du navigateur, puis <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.</>
              )}
            </div>
            <button onClick={() => setInstallHelpOpen(false)} className="mt-4 w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white">Compris</button>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(Navbar);
