import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import AuthShell from '@/components/AuthShell';

export default function LoginPage() {
  const { signIn, profile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error, profileRole } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }

    if (profileRole === 'admin') {
      navigate('/admin');
    } else if (profileRole === 'provider') {
      navigate('/provider/dashboard');
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title={t.auth.login}
      subtitle={t.landing.heroDescription}
      visualTitle={`${t.landing.heroTitle} ${t.landing.heroSubtitle}`}
      visualSubtitle={t.landing.platformBadge}
    >
        <div className="auth-stagger">
          {error && (
            <div role="alert" className="auth-error mb-5 flex items-start gap-2.5 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-stagger space-y-5">
            <div className="auth-field">
              <label className="label" htmlFor="login-email">{t.auth.email}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="input-field pl-10 pr-4"
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="label" htmlFor="login-password">{t.auth.password}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="input-field pl-10 pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
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
            </div>

            <button type="submit" disabled={loading} className="auth-submit btn-primary mt-2 w-full justify-between px-5" aria-busy={loading}>
              <span className="mx-auto inline-flex items-center gap-2">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Connexion...</> : <>{t.auth.login}<ArrowRight size={17} /></>}
              </span>
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/reset-password" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-700 transition-colors hover:text-accent-600">
              {t.auth.forgotPassword}
            </Link>
          </div>

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t.auth.noAccount}{' '}
          <Link to="/signup" className="font-bold text-primary-700 transition-colors hover:text-accent-600">
            {t.auth.signup}
          </Link>
        </p>
        </div>
    </AuthShell>
  );
}
