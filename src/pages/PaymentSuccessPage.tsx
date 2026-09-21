import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/context/I18nContext';

export default function PaymentSuccessPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processPayment = async () => {
      const tx_ref = searchParams.get('tx_ref');
      const bookingId = searchParams.get('bookingId');

      if (!tx_ref) {
        setStatus('error');
        setMessage('Paramètres de paiement manquants');
        return;
      }

      try {
        // Verify the Flutterwave payment
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tx_ref }),
        });

        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Payment verification failed');
        }

        setStatus('success');
        setMessage('Paiement réussi !');

        // Redirect to bookings after 2 seconds
        setTimeout(() => {
          navigate('/bookings');
        }, 2000);
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage('Erreur lors du traitement du paiement');
      }
    };

    processPayment();
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Loader2 size={40} className="animate-spin" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-neutral-900">Traitement du paiement</h2>
              <p className="mt-2 text-neutral-600">Veuillez patienter...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-100 text-success-600">
                <Check size={40} />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-neutral-900">Paiement réussi !</h2>
              <p className="mt-2 text-neutral-600">{message}</p>
              <p className="mt-4 text-sm text-neutral-500">Redirection vers vos réservations...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-error-100 text-error-600">
                <X size={40} />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-neutral-900">Erreur de paiement</h2>
              <p className="mt-2 text-neutral-600">{message}</p>
              <button
                onClick={() => navigate('/bookings')}
                className="mt-6 btn-primary w-full"
              >
                Retourner aux réservations
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
