import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, MessageSquare, Heart, LayoutDashboard, Shield, LogOut, User, Briefcase, Settings, UserCircle, Moon, Sun, Globe, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useI18n } from '@/context/I18nContext';
import NotificationBell from '@/components/NotificationBell';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { language, setLanguage, supportedLanguages } = useI18n();
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
    <nav className={`sticky top-0 z-50 ${darkMode ? 'glass-nav-dark' : 'glass-nav'}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30">
              <Briefcase size={24} />
            </span>
            <span className={darkMode ? 'text-white' : 'text-neutral-900'}>SERVIO</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive('/') 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              Accueil
            </Link>
            <Link
              to="/search"
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive('/search') 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              Explorer
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
                Mon espace
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
                Administration
              </Link>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to="/messages"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <MessageSquare size={20} />
              </Link>
              <Link
                to="/favorites"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}
              >
                <Heart size={20} />
              </Link>
              <NotificationBell />
              
              <button
                onClick={toggleDarkMode}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
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
                  className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-neutral-100"
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
                    <div className="absolute right-0 top-12 z-20 w-56 animate-slide-down rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
                      <Link
                        to={dashboardLink()}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        {profile?.role === 'admin' ? <Shield size={16} /> : <LayoutDashboard size={16} />}
                        Tableau de bord
                      </Link>
                      <Link
                        to="/favorites"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <Heart size={16} />
                        Mes favoris
                      </Link>
                      <Link
                        to="/messages"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <MessageSquare size={16} />
                        Messagerie
                      </Link>
                      <Link
                        to="/notifications"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <MessageSquare size={16} />
                        Notifications
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <UserCircle size={16} />
                        Mon profil
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <Settings size={16} />
                        Paramètres
                      </Link>
                      <div className="my-1 border-t border-neutral-100" />
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50"
                      >
                        <LogOut size={16} />
                        Déconnexion
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
                Connexion
              </Link>
              <Link to="/signup" className="btn-primary">
                S'inscrire
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 py-3 md:hidden">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-neutral-700">Accueil</Link>
          <Link to="/search" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-neutral-700">Explorer</Link>
          {user ? (
            <>
              <Link to="/messages" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-neutral-700">Messagerie</Link>
              <Link to="/favorites" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-neutral-700">Favoris</Link>
              <Link to={dashboardLink()} onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-neutral-700">Tableau de bord</Link>
              <button onClick={handleSignOut} className="block w-full py-2 text-left text-sm font-medium text-error-600">Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-primary-600">Connexion</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-primary-600">S'inscrire</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
