import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Mail, Lock, ArrowLeft, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const isResetFlow = searchParams.has('token');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
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
          <h1 className="mt-6 text-2xl font-bold text-neutral-900">
            {isResetFlow ? 'Nouveau mot de passe' : 'Réinitialiser le mot de passe'}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {isResetFlow 
              ? 'Entrez votre nouveau mot de passe' 
              : 'Entrez votre email pour recevoir un lien de réinitialisation'}
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700">
              <CheckCircle size={18} />
              {isResetFlow 
                ? 'Mot de passe mis à jour avec succès. Redirection...' 
                : 'Email de réinitialisation envoyé. Vérifiez votre boîte mail.'}
            </div>
          )}

          {!success && (
            <form onSubmit={isResetFlow ? handleUpdatePassword : handleRequestReset} className="space-y-4">
              {!isResetFlow && (
                <div>
                  <label className="label">Email</label>
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
              )}

              {isResetFlow && (
                <>
                  <div>
                    <label className="label">Nouveau mot de passe</label>
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

                  <div>
                    <label className="label">Confirmer le mot de passe</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field pl-10"
                        placeholder="Confirmer le mot de passe"
                      />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Loader2 size={18} className="animate-spin" /> : isResetFlow ? 'Mettre à jour' : 'Envoyer le lien'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700">
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
