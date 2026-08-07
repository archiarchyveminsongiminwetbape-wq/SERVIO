import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Video, User, Check, X, Loader2, MessageSquare, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Booking, ProviderProfile } from '@/types';
import { formatCurrency } from '@/data/currencies';
import { formatDate } from '@/lib/utils';

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<Record<string, ProviderProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  async function loadBookings() {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('client_id', user.id)
      .order('scheduled_at', { ascending: false });

    if (data) {
      setBookings(data as Booking[]);

      // Load provider information
      const providerIds = [...new Set(data.map(b => b.provider_id))];
      const { data: providerData } = await supabase
        .from('provider_profiles')
        .select('*')
        .in('id', providerIds);

      if (providerData) {
        const providerMap: Record<string, ProviderProfile> = {};
        providerData.forEach(p => {
          providerMap[p.id] = p as ProviderProfile;
        });
        setProviders(providerMap);
      }
    }

    setLoading(false);
  }

  const statusInfo: Record<string, { label: string; color: string; icon: typeof Check }> = {
    pending: { label: 'En attente', color: 'bg-warning-100 text-warning-700', icon: Clock },
    confirmed: { label: 'Confirmé', color: 'bg-success-100 text-success-700', icon: Check },
    completed: { label: 'Terminé', color: 'bg-neutral-100 text-neutral-700', icon: Check },
    cancelled: { label: 'Annulé', color: 'bg-error-100 text-error-700', icon: X },
    no_show: { label: 'Absent', color: 'bg-error-100 text-error-700', icon: X },
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Mes rendez-vous</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {bookings.length > 0 ? `${bookings.length} rendez-vous` : 'Aucun rendez-vous'}
        </p>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const provider = providers[booking.provider_id];
            const status = statusInfo[booking.status] || statusInfo.pending;
            const StatusIcon = status.icon;

            return (
              <div key={booking.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {provider?.avatar_url ? (
                      <img src={provider.avatar_url} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-xl font-bold text-primary-700">
                        {provider?.business_name?.[0] || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-neutral-900">{provider?.business_name || 'Prestataire'}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-neutral-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {formatDate(booking.scheduled_at)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          {new Date(booking.scheduled_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          {booking.location_type === 'remote' ? (
                            <>
                              <Video size={14} />
                              Visioconférence
                            </>
                          ) : (
                            <>
                              <MapPin size={14} />
                              {booking.location_address || 'Adresse non spécifiée'}
                            </>
                          )}
                        </div>
                        {booking.price && (
                          <div className="flex items-center gap-2">
                            <CreditCard size={14} />
                            {formatCurrency(booking.price, booking.currency)}
                          </div>
                        )}
                      </div>
                      {booking.notes && (
                        <p className="mt-2 text-sm text-neutral-500 italic">"{booking.notes}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/messages`)}
                      className="btn-ghost"
                      title="Contacter le prestataire"
                    >
                      <MessageSquare size={18} />
                    </button>
                    <button
                      onClick={() => navigate(`/provider/${provider?.slug}`)}
                      className="btn-secondary"
                      title="Voir le profil"
                    >
                      <User size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Calendar size={48} className="text-neutral-300" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">Aucun rendez-vous</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Vous n'avez pas encore de rendez-vous planifiés.
          </p>
          <button onClick={() => navigate('/search')} className="btn-primary mt-6">
            Trouver un prestataire
          </button>
        </div>
      )}
    </div>
  );
}
