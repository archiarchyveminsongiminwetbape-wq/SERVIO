import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Loader2, CreditCard, Crown, Star, Zap, ArrowLeft, TrendingUp, Shield, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import type { Subscription, SubscriptionPlan } from '@/types';

const plans: Array<{
  id: SubscriptionPlan;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  quarterlyPrice: number;
  features: string[];
  popularFeatures: string[];
  limitations: string[];
  icon: typeof Crown;
  color: string;
  recommended: boolean;
}> = [
  {
    id: 'free',
    name: 'Gratuit',
    monthlyPrice: 0,
    yearlyPrice: 0,
    quarterlyPrice: 0,
    features: [
      'Profil de base',
      'Jusqu\'à 5 réalisations dans le portfolio',
      'Messagerie illimitée',
      'Support par email',
      'Accès aux demandes de service',
    ],
    popularFeatures: [],
    limitations: [
      'Réservations limitées',
      'Pas de badge de vérification',
      'Pas de statistiques',
      'Support standard',
    ],
    icon: Star,
    color: 'text-neutral-600 bg-neutral-100',
    recommended: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 6500,
    yearlyPrice: 65000,
    quarterlyPrice: 17500,
    features: [
      'Tout du plan Gratuit',
      'Réalisations illimitées',
      'Badge "Vérifié" ✅',
      'Priorité dans les recherches',
      'Support prioritaire',
      '10% de réduction sur commission',
    ],
    popularFeatures: [
      'Badge de vérification',
      'Commission réduite',
    ],
    limitations: [
      'Pas de mise en avant',
      'Statistiques basiques',
    ],
    icon: Star,
    color: 'text-primary-600 bg-primary-100',
    recommended: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 19500,
    yearlyPrice: 195000,
    quarterlyPrice: 52500,
    features: [
      'Tout du plan Basic',
      'Profil en vedette 🌟',
      'Statistiques avancées',
      'Badge "Réponse rapide" ⚡',
      'Support dédié 24/7',
      'Personnalisation du profil',
      'Commission réduite à 10%',
      'Analyses de performance',
    ],
    popularFeatures: [
      'Mise en avant dans les résultats',
      'Commission réduite à 10%',
      'Support 24/7',
    ],
    limitations: [
      'Sans API d\'accès',
      'Sans gestion d\'équipe',
    ],
    icon: Zap,
    color: 'text-accent-600 bg-accent-100',
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 65000,
    yearlyPrice: 650000,
    quarterlyPrice: 175000,
    features: [
      'Tout du plan Pro',
      'API d\'accès complet 🔌',
      'Gestion d\'équipe 👥',
      'Rapports personnalisés',
      'Account manager dédié',
      'Formation incluse',
      'Commission réduite à 5%',
      'SLA garanti',
      'Support prioritaire VIP',
    ],
    popularFeatures: [
      'API accès complet',
      'Commission réduite à 5%',
      'Account manager dédié',
    ],
    limitations: [],
    icon: Crown,
    color: 'text-success-600 bg-success-100',
    recommended: false,
  },
];

export default function SubscriptionCheckoutPage() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') as SubscriptionPlan | null;
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedPlan = plans.find(p => p.id === planId);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!planId || !selectedPlan) {
      navigate('/subscription');
      return;
    }
  }, [user, planId, selectedPlan, navigate]);

  function getPriceForPeriod(plan: typeof plans[0]) {
    switch (billingPeriod) {
      case 'monthly':
        return plan.monthlyPrice;
      case 'quarterly':
        return plan.quarterlyPrice;
      case 'yearly':
        return plan.yearlyPrice;
    }
  }

  function getPeriodLabel() {
    switch (billingPeriod) {
      case 'monthly':
        return 'mensuel';
      case 'quarterly':
        return 'trimestriel';
      case 'yearly':
        return 'annuel';
    }
  }

  function getPeriodDuration() {
    switch (billingPeriod) {
      case 'monthly':
        return '30 jours';
      case 'quarterly':
        return '90 jours';
      case 'yearly':
        return '365 jours';
    }
  }

  async function handlePayment() {
    if (!user || !selectedPlan) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Simuler le paiement (à remplacer par l'intégration Flutterwave réelle)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Créer l'abonnement
      const { data: providerData } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!providerData) {
        throw new Error('Profil prestataire non trouvé');
      }

      const periodStart = new Date().toISOString();
      let periodEnd: Date;
      
      switch (billingPeriod) {
        case 'monthly':
          periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarterly':
          periodEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
          break;
        case 'yearly':
          periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          provider_id: providerData.id,
          plan: selectedPlan.id,
          billing_period: billingPeriod,
          status: 'active',
          current_period_start: periodStart,
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          benefits: {
            commission_rate: selectedPlan.id === 'enterprise' ? 0.05 : selectedPlan.id === 'pro' ? 0.10 : 0.15,
            featured_listing: selectedPlan.id === 'pro' || selectedPlan.id === 'enterprise',
            premium_badge: selectedPlan.id !== 'free',
            advanced_analytics: selectedPlan.id === 'pro' || selectedPlan.id === 'enterprise',
            priority_support: selectedPlan.id !== 'free',
            unlimited_portfolio: selectedPlan.id !== 'free',
          },
        });

      if (subscriptionError) throw subscriptionError;

      setSuccess('Abonnement activé avec succès ! Redirection...');
      setTimeout(() => navigate('/subscription/success'), 2000);
    } catch (error) {
      console.error('Payment error:', error);
      setError('Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  if (!selectedPlan) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary-600" />
      </div>
    );
  }

  const currentPrice = getPriceForPeriod(selectedPlan);
  const Icon = selectedPlan.icon;

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate('/subscription')}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8"
        >
          <ArrowLeft size={20} />
          Retour aux plans
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Confirmer votre abonnement
            </h1>
            <p className="text-neutral-600">
              Vous êtes sur le point de souscrire au plan {selectedPlan.name}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-success-200 bg-success-50 p-4 text-sm text-success-700">
              {success}
            </div>
          )}

          {/* Plan Summary */}
          <div className="bg-neutral-50 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-lg ${selectedPlan.color}`}>
                <Icon size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">{selectedPlan.name}</h2>
                <p className="text-neutral-600">Plan {getPeriodLabel()}</p>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-4xl font-bold text-neutral-900">
                {currentPrice === 0 ? 'Gratuit' : `${currentPrice.toLocaleString('fr-FR')} FCFA`}
              </span>
              {currentPrice > 0 && <span className="text-neutral-500">/{getPeriodLabel()}</span>}
            </div>

            <div className="text-sm text-neutral-600">
              <p>Durée: {getPeriodDuration()}</p>
              {billingPeriod === 'yearly' && (
                <p className="text-green-600 font-medium mt-1">
                  Économisez 17% par rapport au prix mensuel
                </p>
              )}
            </div>
          </div>

          {/* Billing Period Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Choisir la période de facturation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  billingPeriod === 'monthly'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-300'
                }`}
              >
                <div className="text-lg font-bold text-neutral-900">Mensuel</div>
                <div className="text-2xl font-bold text-primary-600">{selectedPlan.monthlyPrice.toLocaleString('fr-FR')} FCFA</div>
                <div className="text-sm text-neutral-500">par mois</div>
              </button>

              <button
                onClick={() => setBillingPeriod('quarterly')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  billingPeriod === 'quarterly'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-300'
                }`}
              >
                <div className="text-lg font-bold text-neutral-900">Trimestriel</div>
                <div className="text-2xl font-bold text-primary-600">{selectedPlan.quarterlyPrice.toLocaleString('fr-FR')} FCFA</div>
                <div className="text-sm text-neutral-500">pour 3 mois (-10%)</div>
              </button>

              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  billingPeriod === 'yearly'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-300'
                }`}
              >
                <div className="text-lg font-bold text-neutral-900">Annuel</div>
                <div className="text-2xl font-bold text-primary-600">{selectedPlan.yearlyPrice.toLocaleString('fr-FR')} FCFA</div>
                <div className="text-sm text-neutral-500">pour 1 an (-17%)</div>
              </button>
            </div>
          </div>

          {/* Features Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Ce que vous obtenez</h3>
            <ul className="space-y-3">
              {selectedPlan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-neutral-600">
                  <Check size={20} className="text-success-600 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Shield className="text-blue-600" size={24} />
              <div>
                <div className="font-semibold text-neutral-900">Commission réduite</div>
                <div className="text-sm text-neutral-600">
                  {selectedPlan.id === 'enterprise' ? '5%' : selectedPlan.id === 'pro' ? '10%' : '15%'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
              <div>
                <div className="font-semibold text-neutral-900">Visibilité accrue</div>
                <div className="text-sm text-neutral-600">
                  {selectedPlan.id === 'free' ? 'Standard' : 'Prioritaire'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Clock className="text-purple-600" size={24} />
              <div>
                <div className="font-semibold text-neutral-900">Support</div>
                <div className="text-sm text-neutral-600">
                  {selectedPlan.id === 'free' ? 'Email' : selectedPlan.id === 'enterprise' ? '24/7 VIP' : 'Prioritaire'}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={loading || currentPrice === 0}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Traitement en cours...
              </>
            ) : currentPrice === 0 ? (
              'Activer gratuitement'
            ) : (
              <>
                <CreditCard size={20} />
                Payer {currentPrice.toLocaleString('fr-FR')} FCFA
              </>
            )}
          </button>

          <div className="mt-6 text-center text-sm text-neutral-500">
            <p>Les paiements sont sécurisés via Flutterwave</p>
            <p className="mt-2">En confirmant, vous acceptez nos conditions d'utilisation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
