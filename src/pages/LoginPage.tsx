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
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Briefcase size={24} />
            </span>
            <span className="text-neutral-900">SERVIO</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-neutral-900">{t.auth.login}</h1>
          <p className="mt-2 text-sm text-neutral-600">{t.auth.hasAccount}</p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t.auth.email}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="vous@exemple.com"
                />
              </div>
            </div>

            <div>
              <label className="label">{t.auth.password}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={18} className="animate-spin" /> : t.auth.login}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/reset-password" className="text-sm text-primary-600 hover:text-primary-700">
              {t.auth.forgotPassword}
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t.auth.noAccount}{' '}
          <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
            {t.auth.signup}
          </Link>
        </p>
      </div>
    </div>
  );
}
