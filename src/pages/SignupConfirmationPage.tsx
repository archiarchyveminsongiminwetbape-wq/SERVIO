import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useI18n } from '@/context/I18nContext';

export default function SignupConfirmationPage() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [countdown, setCountdown] = useState(10);

  // Auto-redirect to login after 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleResendEmail = async () => {
    setResending(true);
    setMessage(null);

    // Simulation de renvoi - en production, appeler Supabase
    setTimeout(() => {
      setResending(false);
      setMessage({ type: 'success', text: t.auth.confirmationSent });
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
            <Mail size={40} className="text-primary-600" />
          </div>

          <h1 className="text-2xl font-bold text-neutral-900">{t.auth.checkEmail}</h1>
          <p className="mt-3 text-sm text-neutral-600">
            {email ? (
              <>
                {t.auth.confirmationSentTo} <strong>{email}</strong>.
              </>
            ) : (
              t.auth.confirmationSent
            )}
          </p>

          <div className="mt-6 rounded-lg bg-primary-50 p-4 text-left">
            <h3 className="text-sm font-semibold text-primary-900">{t.auth.nextSteps}</h3>
            <ol className="mt-2 space-y-2 text-sm text-primary-800">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-200 text-xs font-bold text-primary-700">1</span>
                <span>{t.auth.openInbox}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-200 text-xs font-bold text-primary-700">2</span>
                <span>{t.auth.findConfirmationEmail}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-200 text-xs font-bold text-primary-700">3</span>
                <span>{t.auth.clickConfirmationLink}</span>
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
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              {t.auth.goToLogin}
              <ArrowRight size={18} />
            </button>
            <p className="text-center text-sm text-neutral-500">
              Redirection automatique dans {countdown} secondes...
            </p>
          </div>

          <div className="mt-6 rounded-lg bg-warning-50 p-4 text-left">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 text-warning-600 flex-shrink-0" />
              <div className="text-sm text-warning-800">
                <p className="font-semibold">{t.auth.emailNotReceived}</p>
                <p className="mt-1">
                  {t.auth.checkSpam}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t.auth.wrongEmail}{' '}
          <button
            onClick={() => navigate('/signup')}
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            {t.auth.tryAnotherEmail}
          </button>
        </p>
      </div>
    </div>
  );
}
