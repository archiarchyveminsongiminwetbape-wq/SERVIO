import { useEffect, useState } from 'react';
import { ArrowLeft, Check, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { SubscriptionPlan } from '@/types';

const planDetails: Record<Exclude<SubscriptionPlan, 'free'>, { name: string; price: number; features: string[] }> = {
  basic: {
    name: 'Basic',
    price: 9.99,
    features: ['Réalisations illimitées', 'Badge "Vérifié"', 'Priorité dans les recherches', 'Support prioritaire'],
  },
  pro: {
    name: 'Pro',
    price: 29.99,
    features: ['Profil en vedette', 'Statistiques avancées', 'Badge "Réponse rapide"', 'Support dédié 24/7'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 99.99,
    features: ['API d’accès', 'Gestion d’équipe', 'Rapports personnalisés', 'Account manager dédié'],
  },
};

export default function SubscriptionCheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = searchParams.get('plan') as Exclude<SubscriptionPlan, 'free'> | null;
  const plan = selectedPlan ? planDetails[selectedPlan] : null;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data, error: providerError }) => {
        if (providerError) setError(providerError.message);
        setProviderId(data?.id ?? null);
        setLoading(false);
      });
  }, [user, navigate]);

  async function confirmSubscription() {
    if (!user || !providerId || !plan || !selectedPlan) return;
    setProcessing(true);
    setError(null);

    const periodStart = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existing, error: lookupError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (lookupError) {
      setError(lookupError.message);
      setProcessing(false);
      return;
    }

    const payload = {
      provider_id: providerId,
      plan: selectedPlan,
      status: 'active',
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      updated_at: periodStart,
    };

    const result = existing?.[0]
      ? await supabase.from('subscriptions').update(payload).eq('id', existing[0].id)
      : await supabase.from('subscriptions').insert({ user_id: user.id, ...payload });

    if (result.error) {
      setError(result.error.message);
      setProcessing(false);
      return;
    }

    navigate('/subscription?success=' + selectedPlan);
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={40} className="animate-spin text-primary-600" /></div>;
  }

  if (!plan || !selectedPlan) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Plan introuvable</h1>
        <p className="mt-2 text-neutral-600">Sélectionnez un plan valide pour continuer.</p>
        <button onClick={() => navigate('/subscription')} className="btn-primary mt-6">Voir les plans</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate('/subscription')} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-primary-600">
          <ArrowLeft size={16} /> Retour aux plans
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary-100 p-3 text-primary-600"><CreditCard size={24} /></div>
              <div><p className="text-sm text-neutral-500">Votre sélection</p><h1 className="text-2xl font-bold text-neutral-900">Plan {plan.name}</h1></div>
            </div>
            <div className="mt-8 space-y-4">
              {plan.features.map((feature) => <div key={feature} className="flex items-center gap-3 text-sm text-neutral-700"><Check size={17} className="text-success-600" />{feature}</div>)}
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-neutral-500"><ShieldCheck size={17} className="text-success-600" />Activation sécurisée par SERVIO</div>
          </section>

          <aside className="rounded-2xl border-2 border-primary-500 bg-primary-50 p-6 shadow-lg sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Récapitulatif</p>
            <div className="mt-4 flex items-end justify-between"><span className="text-neutral-700">Abonnement mensuel</span><span className="text-3xl font-bold text-neutral-900">{plan.price.toFixed(2)}€</span></div>
            <p className="mt-1 text-right text-sm text-neutral-500">par mois</p>
            {error && <p className="mt-6 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">{error}</p>}
            <button onClick={confirmSubscription} disabled={processing || !providerId} className="btn-primary mt-8 flex w-full items-center justify-center gap-2">
              {processing ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
              Confirmer le plan {plan.name}
            </button>
            {!providerId && <p className="mt-3 text-center text-xs text-error-600">Votre profil prestataire est requis.</p>}
          </aside>
        </div>
      </div>
    </div>
  );
}
