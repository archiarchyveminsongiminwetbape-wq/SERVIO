import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

export default function LoginPage() {
  const { signIn, profile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-3 sm:px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 sm:mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 sm:gap-2 text-xl sm:text-2xl font-bold">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Briefcase size={18} className="sm:size-24" />
            </span>
            <span className="text-neutral-900">SERVIO</span>
          </Link>
          <h1 className="mt-4 sm:mt-6 text-xl sm:text-2xl font-bold text-neutral-900">{t.auth.login}</h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-neutral-600">Connectez-vous à votre compte SERVIO</p>
        </div>

        <div className="card p-4 sm:p-6 md:p-8">
          {error && (
            <div className="mb-3 sm:mb-4 flex items-center gap-2 rounded-lg bg-error-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-error-700">
              <AlertCircle size={14} className="sm:size-18" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="label text-xs sm:text-sm">{t.auth.email}</label>
              <div className="relative">
                <Mail size={14} className="sm:size-18 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-9 sm:pl-10 py-2 sm:py-2.5 text-sm"
                  placeholder="vous@exemple.com"
                />
              </div>
            </div>

            <div>
              <label className="label text-xs sm:text-sm">{t.auth.password}</label>
              <div className="relative">
                <Lock size={14} className="sm:size-18 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-9 sm:pl-10 py-2 sm:py-2.5 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2 sm:py-2.5 text-sm sm:text-base">
              {loading ? <Loader2 size={16} className="sm:size-18 animate-spin" /> : t.auth.login}
            </button>
          </form>

          <div className="mt-3 sm:mt-4 text-center">
            <Link to="/reset-password" className="text-xs sm:text-sm text-primary-600 hover:text-primary-700">
              {t.auth.forgotPassword}
            </Link>
          </div>
        </div>

        <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-neutral-600">
          {t.auth.noAccount}{' '}
          <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
            {t.auth.signup}
          </Link>
        </p>
      </div>
    </div>
  );
}
