import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, CreditCard, Crown, Star, Zap, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import type { Subscription, SubscriptionPlan } from '@/types';

const plans: Array<{
  id: SubscriptionPlan;
  name: string;
  price: number;
  period: string;
  features: string[];
  icon: typeof Crown;
  color: string;
}> = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    period: 'pour toujours',
    features: [
      'Profil de base',
      'Jusqu\'à 5 réalisations',
      'Messagerie illimitée',
      'Support par email',
    ],
    icon: Star,
    color: 'text-neutral-600 bg-neutral-100',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    period: 'par mois',
    features: [
      'Tout du plan Gratuit',
      'Réalisations illimitées',
      'Badge "Vérifié"',
      'Priorité dans les recherches',
      'Support prioritaire',
    ],
    icon: Star,
    color: 'text-primary-600 bg-primary-100',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    period: 'par mois',
    features: [
      'Tout du plan Basic',
      'Profil en vedette',
      'Statistiques avancées',
      'Badge "Réponse rapide"',
      'Support dédié 24/7',
      'Personnalisation du profil',
    ],
    icon: Zap,
    color: 'text-accent-600 bg-accent-100',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    period: 'par mois',
    features: [
      'Tout du plan Pro',
      'API d\'accès',
      'Gestion d\'équipe',
      'Rapports personnalisés',
      'Account manager dédié',
      'Formation incluse',
    ],
    icon: Crown,
    color: 'text-success-600 bg-success-100',
  },
];

function getSupabaseErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const details = error as { message?: string; details?: string; hint?: string; code?: string };
    return [details.message, details.details, details.hint, details.code ? `Code: ${details.code}` : '']
      .filter(Boolean)
      .join(' — ') || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export default function SubscriptionPage() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadSubscription();
  }, [user, navigate]);

  async function loadSubscription() {
    if (!user) return;
    setLoading(true);
    setError(null);

    const [{ data: subscriptionData, error: subscriptionError }, { data: providerData, error: providerError }] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    if (subscriptionError) setError(subscriptionError.message);
    if (providerError) setError(providerError.message);
    setProviderId(providerData?.id ?? null);
    setSubscription(subscriptionData as Subscription | null);
    setLoading(false);
  }

  async function handleUpgrade(plan: SubscriptionPlan) {
    if (!user || !profile || !providerId) {
      setError('Votre profil prestataire doit être configuré avant de souscrire à un plan.');
      return;
    }
    setUpgrading(plan);
    setError(null);
    setSuccess(null);

    try {
      const { data: existingSubscriptions, error: existingSubscriptionError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingSubscriptionError) throw existingSubscriptionError;

      const periodStart = new Date().toISOString();
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const subscriptionPayload = {
        provider_id: providerId,
        plan,
        status: 'active',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
        updated_at: periodStart,
      };

      if (existingSubscriptions && existingSubscriptions.length > 0) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update(subscriptionPayload)
          .eq('id', existingSubscriptions[0].id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({ user_id: user.id, ...subscriptionPayload });
        if (insertError) throw insertError;
      }

      await loadSubscription();
      setSuccess(`Le plan ${plans.find((item) => item.id === plan)?.name ?? plan} a été activé avec succès.`);
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      setError(getSupabaseErrorMessage(error, 'Impossible de modifier l’abonnement.'));
    } finally {
      setUpgrading(null);
    }
  }

  function openCheckout(plan: SubscriptionPlan) {
    if (plan === 'free') return;
    navigate(`/subscription/checkout?plan=${plan}`);
  }

  async function handleCancel() {
    if (!subscription) return;
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) return;

    try {
      await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: true })
        .eq('id', subscription.id);
      await loadSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary-600" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-lg text-neutral-600">
            Débloquez tout le potentiel de votre profil professionnel
          </p>
        </div>

          {error && (
            <div className="mb-8 rounded-lg border border-error-200 bg-error-50 p-4 text-center text-sm text-error-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-8 rounded-lg border border-success-200 bg-success-50 p-4 text-center text-sm text-success-700">
              {success}
            </div>
          )}

        {subscription && subscription.cancel_at_period_end && (
          <div className="mb-8 rounded-lg bg-warning-50 border border-warning-200 p-4 text-center">
            <p className="text-warning-800">
              Votre abonnement sera annulé le {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;
            const isUpgrade = plans.findIndex(p => p.id === currentPlan) < plans.findIndex(p => p.id === plan.id);

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 border-2 transition-all ${
                  isCurrent
                    ? 'border-primary-500 bg-primary-50 shadow-lg'
                    : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-md'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Plan actuel
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-lg ${plan.color}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
                    <p className="text-sm text-neutral-500">{plan.period}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-neutral-900">
                    {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                  </span>
                  {plan.price > 0 && <span className="text-neutral-500">/mois</span>}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-neutral-600">
                      <Check size={16} className="text-success-600 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full btn-secondary opacity-50 cursor-not-allowed"
                  >
                    Plan actuel
                  </button>
                ) : (
                  <button
                    onClick={() => openCheckout(plan.id)}
                    disabled={upgrading === plan.id}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    {upgrading === plan.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        {isUpgrade ? 'Passer à ce plan' : 'Downgrade'}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {subscription && subscription.plan !== 'free' && !subscription.cancel_at_period_end && (
          <div className="mt-8 text-center">
            <button
              onClick={handleCancel}
              className="text-sm text-neutral-500 hover:text-error-600 underline"
            >
              Annuler mon abonnement
            </button>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-neutral-500">
          <p>Tous les prix sont en euros. Les paiements sont sécurisés via Stripe.</p>
          <p className="mt-2">Vous pouvez annuler votre abonnement à tout moment.</p>
        </div>
      </div>
    </div>
  );
}
