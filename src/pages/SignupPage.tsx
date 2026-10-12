import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2, Search, Wrench, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import AuthShell from '@/components/AuthShell';

export default function SignupPage() {
  const { signUp } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'visitor' | 'provider'>('visitor');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordProgress = Math.min((password.length / 8) * 100, 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (!fullName.trim()) {
      setError('Veuillez entrer votre nom complet.');
      return;
    }

    setLoading(true);
    
    const { error } = await signUp(email, password, {
      full_name: fullName,
      role,
    });

    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/login');
    }
  };

  return (
    <AuthShell
      title={t.auth.signup}
      subtitle={t.landing.heroDescription}
      visualTitle={`${t.landing.heroTitle} ${t.landing.heroSubtitle}`}
      visualSubtitle={t.landing.platformBadge}
    >
        <div className="auth-stagger">
          {error && (
            <div role="alert" className="auth-error mb-5 flex items-start gap-2.5 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-6" role="group" aria-label={t.auth.signup}>
            <p className="label">{t.auth.signup}</p>
            <div className="auth-stagger grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('visitor')}
                aria-pressed={role === 'visitor'}
                className={`auth-role-option relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center sm:min-h-32 sm:p-4 ${
                  role === 'visitor'
                    ? 'border-primary-600 bg-primary-50 text-primary-800'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-300 hover:bg-primary-50/50'
                }`}
              >
                {role === 'visitor' && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-white"><Check size={12} /></span>}
                <Search size={22} strokeWidth={1.8} />
                <span className="text-sm font-bold">{t.user.role.visitor}</span>
                <span className="text-xs text-neutral-500">Je cherche un prestataire</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('provider')}
                aria-pressed={role === 'provider'}
                className={`auth-role-option relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center sm:min-h-32 sm:p-4 ${
                  role === 'provider'
                    ? 'border-primary-600 bg-primary-50 text-primary-800'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-300 hover:bg-primary-50/50'
                }`}
              >
                {role === 'provider' && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-white"><Check size={12} /></span>}
                <Wrench size={22} strokeWidth={1.8} />
                <span className="text-sm font-bold">{t.user.role.provider}</span>
                <span className="text-xs text-neutral-500">Je propose mes services</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-stagger space-y-4">
            <div className="auth-field">
              <label className="label" htmlFor="signup-name">{t.auth.fullName}</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setError(null); }}
                  className="input-field pl-10"
                  placeholder="Jean Dupont"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="label" htmlFor="signup-email">{t.auth.email}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="input-field pl-10"
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="label" htmlFor="signup-password">{t.auth.password}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="input-field pl-10 pr-12"
                  placeholder="Min. 8 caractères"
                  autoComplete="new-password"
                  aria-describedby="signup-password-hint"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2" aria-hidden="true">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div className={`h-full rounded-full transition-all duration-300 ${password.length >= 8 ? 'bg-success-500' : password.length >= 4 ? 'bg-warning-500' : 'bg-neutral-300'}`} style={{ width: `${passwordProgress}%` }} />
                </div>
                <span className="min-w-24 text-right text-[11px] text-neutral-500">{password.length >= 8 ? 'Mot de passe valide' : '8 caractères minimum'}</span>
              </div>
              <span id="signup-password-hint" className="sr-only">{t.auth.passwordMinLength}</span>
            </div>

            <button type="submit" disabled={loading} className="auth-submit btn-primary mt-2 w-full justify-between px-5" aria-busy={loading}>
              <span className="mx-auto inline-flex items-center gap-2">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Création du compte...</> : <>{t.auth.signup}<ArrowRight size={17} /></>}
              </span>
            </button>
          </form>

          {role === 'provider' && (
            <p className="auth-error mt-4 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-xs leading-relaxed text-accent-800">
              En tant que prestataire, votre profil sera soumis à validation par notre équipe
              avant d'être visible publiquement.
            </p>
          )}

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t.auth.hasAccount}{' '}
          <Link to="/login" className="font-bold text-primary-700 transition-colors hover:text-accent-600">
            {t.auth.login}
          </Link>
        </p>
        </div>
    </AuthShell>
  );
}
