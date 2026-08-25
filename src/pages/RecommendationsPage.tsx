import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import type { ProviderProfile } from '@/types';
import ProviderCard from '@/components/ProviderCard';

export default function RecommendationsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadRecommendations();
  }, [user, navigate]);

  async function loadRecommendations() {
    if (!user) return;
    setLoading(true);

    try {
      const { data } = await supabase.rpc('get_recommended_providers', {
        user_id_param: user.id,
        limit_count: 12
      });

      if (data) {
        // Load full provider profiles
        const providerIds = (data as any[]).map(r => r.provider_profile_id);
        const { data: providers } = await supabase
          .from('provider_profiles')
          .select('id, business_name, slug, headline, avatar_url, banner_url, category_id, skills, rating_avg, rating_count, city, country, remote_service, availability, badges, price_range, is_featured, experience_years, languages, validation_status, category:categories(id, name, slug)')
          .in('id', providerIds);

        setRecommendations(providers as ProviderProfile[] ?? []);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function trackInteraction(providerId: string, type: 'view' | 'favorite' | 'message' | 'booking' | 'review') {
    if (!user) return;

    try {
      await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          provider_profile_id: providerId,
          interaction_type: type,
          interaction_value: type === 'view' ? 1 : type === 'favorite' ? 3 : type === 'message' ? 2 : type === 'booking' ? 5 : 4,
        });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles size={32} className="text-accent-600" />
            <h1 className="text-4xl font-bold text-neutral-900">
              Recommandations pour vous
            </h1>
          </div>
          <p className="text-lg text-neutral-600">
            Des prestataires sélectionnés selon vos intérêts et votre historique
          </p>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp size={64} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Aucune recommandation pour le moment
            </h3>
            <p className="text-neutral-600 mb-6">
              Explorez des prestataires et ajoutez-les à vos favoris pour recevoir des recommandations personnalisées.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="btn-primary inline-flex items-center gap-2"
            >
              Explorer les prestataires
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendations.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => trackInteraction(provider.id, 'view')}
                >
                  <ProviderCard provider={provider} />
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <button
                onClick={() => navigate('/search')}
                className="btn-secondary inline-flex items-center gap-2"
              >
                Voir tous les prestataires
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
