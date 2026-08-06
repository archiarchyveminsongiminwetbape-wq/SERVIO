import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, MessageSquare, Heart, LayoutDashboard, Shield, LogOut, User, Briefcase, Settings, UserCircle, Moon, Sun, Globe, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useI18n } from '@/context/I18nContext';
import NotificationsPanel from '@/components/NotificationsPanel';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { language, setLanguage, supportedLanguages, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

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
    <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${darkMode ? 'border-white/10 bg-slate-950/80 backdrop-blur-xl' : 'border-white/60 bg-white/80 backdrop-blur-xl'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-4 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl font-bold tracking-tight">
            <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30 ring-4 ring-primary-500/10">
              <Briefcase size={18} className="sm:size-24" />
            </span>
            <span className={`hidden sm:block ${darkMode ? 'text-white' : 'text-neutral-900'}`}>SERVIO</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive('/') 
                  ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100' 
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {t.nav.home}
            </Link>
            <Link
              to="/search"
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive('/search') 
                  ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100' 
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {t.nav.search}
            </Link>
            {profile?.role === 'provider' && (
              <Link
                to="/provider/dashboard"
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive('/provider/dashboard') 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {t.nav.dashboard}
              </Link>
            )}
            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive('/admin') 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {t.nav.dashboard}
              </Link>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:gap-3 md:flex">
          {user ? (
            <>
              <Link
                to="/messages"
                className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-neutral-600 transition-all hover:bg-neutral-100 hover:text-neutral-900 hover:shadow-sm"
              >
                <MessageSquare size={18} className="sm:size-20" />
              </Link>
              <Link
                to="/favorites"
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition-all ${darkMode ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 hover:shadow-sm'}`}
              >
                <Heart size={18} className="sm:size-20" />
              </Link>
              <NotificationsPanel />
              
              <button
                onClick={toggleDarkMode}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}
              >
                {darkMode ? <Sun size={18} className="sm:size-20" /> : <Moon size={18} className="sm:size-20" />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-100"
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
                    <div className="absolute right-0 top-12 z-20 w-48 animate-slide-down rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
                      {supportedLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { setLanguage(lang.code); setLangMenuOpen(false); }}
                          className={`flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-50 ${
                            language === lang.code ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                          }`}
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
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/80 p-1 pr-2 transition-all hover:border-primary-200 hover:bg-primary-50/60"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary-100 text-xs sm:text-sm font-semibold text-primary-700">
                      {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-neutral-700">
                    {profile?.full_name?.split(' ')[0] ?? 'Profil'}
                  </span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-12 z-20 w-56 animate-slide-down rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
                      <Link
                        to={dashboardLink()}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        {profile?.role === 'admin' ? <Shield size={16} /> : <LayoutDashboard size={16} />}
                        {t.nav.dashboard}
                      </Link>
                      <Link
                        to="/favorites"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <Heart size={16} />
                        {t.nav.profile}
                      </Link>
                      <Link
                        to="/messages"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <MessageSquare size={16} />
                        Messages
                      </Link>
                      <Link
                        to="/notifications"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <MessageSquare size={16} />
                        {t.nav.settings}
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <UserCircle size={16} />
                        {t.nav.profile}
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <Settings size={16} />
                        {t.nav.settings}
                      </Link>
                      <div className="my-1 border-t border-neutral-100" />
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
                    <div className="absolute right-0 top-12 z-20 w-48 animate-slide-down rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
                      {supportedLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { setLanguage(lang.code); setLangMenuOpen(false); }}
                          className={`flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-50 ${
                            language === lang.code ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <Link to="/login" className="btn-ghost">
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
          className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg md:hidden ${darkMode ? 'text-white hover:bg-white/10' : 'text-neutral-600 hover:bg-neutral-100'}`}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className={`border-t px-3 py-4 md:hidden ${darkMode ? 'border-white/10 bg-slate-950' : 'border-neutral-200 bg-white'}`}>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Link to="/" onClick={() => setMobileOpen(false)} className={`rounded-xl px-3 py-2 text-sm font-semibold ${darkMode ? 'bg-white/5 text-white' : 'bg-neutral-50 text-neutral-700'}`}>{t.nav.home}</Link>
            <Link to="/search" onClick={() => setMobileOpen(false)} className={`rounded-xl px-3 py-2 text-sm font-semibold ${darkMode ? 'bg-white/5 text-white' : 'bg-neutral-50 text-neutral-700'}`}>{t.nav.search}</Link>
          </div>

          {user ? (
            <div className="space-y-1.5">
              <Link to="/messages" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${darkMode ? 'text-white hover:bg-white/5' : 'text-neutral-700 hover:bg-neutral-50'}`}><MessageSquare size={16} /> Messages</Link>
              <Link to="/favorites" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${darkMode ? 'text-white hover:bg-white/5' : 'text-neutral-700 hover:bg-neutral-50'}`}><Heart size={16} /> {t.nav.profile}</Link>
              <Link to="/notifications" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${darkMode ? 'text-white hover:bg-white/5' : 'text-neutral-700 hover:bg-neutral-50'}`}><MessageSquare size={16} /> {t.nav.settings}</Link>
              <Link to={dashboardLink()} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${darkMode ? 'text-white hover:bg-white/5' : 'text-neutral-700 hover:bg-neutral-50'}`}>{profile?.role === 'admin' ? <Shield size={16} /> : <LayoutDashboard size={16} />} {t.nav.dashboard}</Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${darkMode ? 'text-white hover:bg-white/5' : 'text-neutral-700 hover:bg-neutral-50'}`}><UserCircle size={16} /> {t.nav.profile}</Link>
              <Link to="/settings" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${darkMode ? 'text-white hover:bg-white/5' : 'text-neutral-700 hover:bg-neutral-50'}`}><Settings size={16} /> {t.nav.settings}</Link>
              <button onClick={handleSignOut} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-error-600 hover:bg-error-50"> <LogOut size={16} /> {t.nav.logout}</button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"> <User size={16} /> {t.nav.login}</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"> <Briefcase size={16} /> {t.nav.signup}</Link>
            </div>
          )}

          <div className={`mt-4 rounded-2xl border px-3 py-2 ${darkMode ? 'border-white/10 bg-white/5' : 'border-neutral-200 bg-neutral-50'}`}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className={`flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-neutral-700'}`}
            >
              <span className="flex items-center gap-2"><Globe size={16} /> Langue</span>
              <span>{supportedLanguages.find(l => l.code === language)?.flag}</span>
            </button>

            {langMenuOpen && (
              <div className="mt-2 space-y-1">
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setLangMenuOpen(false); setMobileOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm ${language === lang.code ? 'bg-primary-50 text-primary-700' : darkMode ? 'text-white hover:bg-white/5' : 'text-neutral-700 hover:bg-neutral-100'}`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
