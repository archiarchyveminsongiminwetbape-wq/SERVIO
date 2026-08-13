import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Mail, Lock, User, AlertCircle, Loader2, Search, Wrench } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

export default function SignupPage() {
  const { signUp } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'visitor' | 'provider'>('visitor');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    console.log('Attempting signup with:', { email, fullName, role });
    
    const { error } = await signUp(email, password, {
      full_name: fullName,
      role,
    });

    if (error) {
      console.error('Signup failed:', error);
      setError(error);
      setLoading(false);
    } else {
      console.log('Signup successful, redirecting to confirmation');
      // Rediriger vers la page de confirmation
      navigate('/signup/confirmation', { state: { email } });
    }
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
          <h1 className="mt-6 text-2xl font-bold text-neutral-900">{t.auth.signup}</h1>
          <p className="mt-2 text-sm text-neutral-600">{t.auth.noAccount}</p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="label">{t.auth.signup}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('visitor')}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  role === 'visitor'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <Search size={24} />
                <span className="text-sm font-semibold">{t.user.role.visitor}</span>
                <span className="text-xs text-neutral-500">Je cherche un prestataire</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('provider')}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  role === 'provider'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <Wrench size={24} />
                <span className="text-sm font-semibold">{t.user.role.provider}</span>
                <span className="text-xs text-neutral-500">Je propose mes services</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t.auth.fullName}</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Jean Dupont"
                />
              </div>
            </div>

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
                  placeholder="Min. 8 caractères"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={18} className="animate-spin" /> : t.auth.signup}
            </button>
          </form>

          {role === 'provider' && (
            <p className="mt-4 rounded-lg bg-accent-50 px-4 py-3 text-xs text-accent-700">
              En tant que prestataire, votre profil sera soumis à validation par notre équipe
              avant d'être visible publiquement.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t.auth.hasAccount}{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            {t.auth.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
