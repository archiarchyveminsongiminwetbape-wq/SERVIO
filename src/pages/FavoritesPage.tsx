import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { ProviderProfile } from '@/types';
import ProviderCard from '@/components/ProviderCard';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    loadFavorites();
  }, [user]);

  async function loadFavorites() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('favorites')
      .select('provider:provider_profiles(*, category:categories(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const favs = (data ?? []).map((f: Record<string, unknown>) => f.provider as ProviderProfile);
    setFavorites(favs);
    setLoading(false);
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-neutral-900">Mes favoris</h1>
      <p className="mt-1 text-sm text-neutral-600">
        {favorites.length > 0 ? `${favorites.length} prestataire${favorites.length > 1 ? 's' : ''} sauvegardé${favorites.length > 1 ? 's' : ''}` : 'Aucun favori pour le moment'}
      </p>

      {favorites.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <Heart size={48} className="text-neutral-300" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">Aucun favori</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Sauvegardez vos prestataires préférés pour les retrouver facilement.
          </p>
          <button onClick={() => navigate('/search')} className="btn-primary mt-6">
            Explorer les prestataires
          </button>
        </div>
      )}
    </div>
  );
}
