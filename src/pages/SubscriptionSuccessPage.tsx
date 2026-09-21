import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function SubscriptionSuccessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processSubscription = async () => {
      const tx_ref = searchParams.get('tx_ref');
      const planId = searchParams.get('plan');

      if (!tx_ref || !user) {
        setStatus('error');
        setMessage('Paramètres manquants');
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

        // Get provider ID
        const { data: providerData } = await supabase
          .from('provider_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!providerData) {
          throw new Error('Provider profile not found');
        }

        // Create or update subscription
        const periodStart = new Date().toISOString();
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const { data: existing, error: lookupError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (lookupError) throw lookupError;

        const payloadData = {
          provider_id: providerData.id,
          provider_profile_id: providerData.id,
          plan: planId,
          status: 'active',
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: false,
          updated_at: periodStart,
        };

        const result = existing?.[0]
          ? await supabase.from('subscriptions').update(payloadData).eq('id', existing[0].id)
          : await supabase.from('subscriptions').insert({ user_id: user.id, ...payloadData });

        if (result.error) throw result.error;

        setStatus('success');
        setMessage('Abonnement activé avec succès !');

        // Redirect to subscription page after 2 seconds
        setTimeout(() => {
          navigate('/subscription?success=' + planId);
        }, 2000);
      } catch (error) {
        console.error('Subscription processing error:', error);
        setStatus('error');
        setMessage('Erreur lors du traitement de l\'abonnement');
      }
    };

    processSubscription();
  }, [searchParams, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Loader2 size={40} className="animate-spin" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-neutral-900">Traitement de l'abonnement</h2>
              <p className="mt-2 text-neutral-600">Veuillez patienter...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-100 text-success-600">
                <Check size={40} />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-neutral-900">Abonnement activé !</h2>
              <p className="mt-2 text-neutral-600">{message}</p>
              <p className="mt-4 text-sm text-neutral-500">Redirection vers vos abonnements...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-error-100 text-error-600">
                <X size={40} />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-neutral-900">Erreur d'abonnement</h2>
              <p className="mt-2 text-neutral-600">{message}</p>
              <button
                onClick={() => navigate('/subscription')}
                className="mt-6 btn-primary w-full"
              >
                Retourner aux abonnements
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
