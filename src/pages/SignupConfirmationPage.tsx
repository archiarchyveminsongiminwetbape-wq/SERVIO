import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function SignupConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResendEmail = async () => {
    setResending(true);
    setMessage(null);

    // Simulation de renvoi - en production, appeler Supabase
    setTimeout(() => {
      setResending(false);
      setMessage({ type: 'success', text: 'Email de confirmation renvoyé avec succès !' });
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
            <Mail size={40} className="text-primary-600" />
          </div>

          <h1 className="text-2xl font-bold text-neutral-900">Vérifiez votre email</h1>
          <p className="mt-3 text-sm text-neutral-600">
            {email ? (
              <>
                Nous avons envoyé un email de confirmation à <strong>{email}</strong>.
              </>
            ) : (
              'Nous avons envoyé un email de confirmation à votre adresse.'
            )}
          </p>

          <div className="mt-6 rounded-lg bg-primary-50 p-4 text-left">
            <h3 className="text-sm font-semibold text-primary-900">Prochaines étapes :</h3>
            <ol className="mt-2 space-y-2 text-sm text-primary-800">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-200 text-xs font-bold text-primary-700">1</span>
                <span>Ouvrez votre boîte de réception email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-200 text-xs font-bold text-primary-700">2</span>
                <span>Cherchez l'email de confirmation de SERVIO</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-200 text-xs font-bold text-primary-700">3</span>
                <span>Cliquez sur le lien de confirmation</span>
              </li>
            </ol>
          </div>

          {message && (
            <div className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
              message.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'
            }`}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className="btn-secondary w-full"
            >
              {resending ? 'Envoi en cours...' : 'Renvoyer l\'email'}
            </button>

            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              Aller à la connexion
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="mt-6 rounded-lg bg-warning-50 p-4 text-left">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 text-warning-600 flex-shrink-0" />
              <div className="text-sm text-warning-800">
                <p className="font-semibold">Email non reçu ?</p>
                <p className="mt-1">
                  Vérifiez vos spams ou dossier courrier indésirable. Si vous ne recevez toujours pas l'email,
                  contactez le support.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Mauvaise adresse email ?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            Réessayer avec une autre adresse
          </button>
        </p>
      </div>
    </div>
  );
}
