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
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-3 sm:px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 sm:mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 sm:gap-2 text-xl sm:text-2xl font-bold">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Briefcase size={18} className="sm:size-24" />
            </span>
            <span className="text-neutral-900">SERVIO</span>
          </Link>
          <h1 className="mt-4 sm:mt-6 text-xl sm:text-2xl font-bold text-neutral-900">{t.auth.signup}</h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-neutral-600">Rejoignez la communauté SERVIO</p>
        </div>

        <div className="card p-4 sm:p-6 md:p-8">
          {error && (
            <div className="mb-3 sm:mb-4 flex items-center gap-2 rounded-lg bg-error-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-error-700">
              <AlertCircle size={14} className="sm:size-18" />
              {error}
            </div>
          )}

          <div className="mb-4 sm:mb-5">
            <label className="label text-xs sm:text-sm">Je suis...</label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setRole('visitor')}
                className={`flex flex-col items-center gap-1.5 sm:gap-2 rounded-lg border-2 p-2.5 sm:p-3 md:p-4 transition-all ${
                  role === 'visitor'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <Search size={18} className="sm:size-20 md:size-24" />
                <span className="text-xs sm:text-sm font-semibold">Client</span>
                <span className="text-[10px] sm:text-xs text-neutral-500">Je cherche un prestataire</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('provider')}
                className={`flex flex-col items-center gap-1.5 sm:gap-2 rounded-lg border-2 p-2.5 sm:p-3 md:p-4 transition-all ${
                  role === 'provider'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <Wrench size={18} className="sm:size-20 md:size-24" />
                <span className="text-xs sm:text-sm font-semibold">Prestataire</span>
                <span className="text-[10px] sm:text-xs text-neutral-500">Je propose mes services</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="label text-xs sm:text-sm">{t.auth.fullName}</label>
              <div className="relative">
                <User size={14} className="sm:size-18 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field pl-9 sm:pl-10 py-2 sm:py-2.5 text-sm"
                  placeholder="Jean Dupont"
                />
              </div>
            </div>

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
                  placeholder="Min. 8 caractères"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2 sm:py-2.5 text-sm sm:text-base">
              {loading ? <Loader2 size={16} className="sm:size-18 animate-spin" /> : t.auth.signup}
            </button>
          </form>

          {role === 'provider' && (
            <p className="mt-3 sm:mt-4 rounded-lg bg-accent-50 px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs text-accent-700">
              En tant que prestataire, votre profil sera soumis à validation par notre équipe
              avant d'être visible publiquement.
            </p>
          )}
        </div>

        <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-neutral-600">
          {t.auth.hasAccount}{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            {t.auth.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
