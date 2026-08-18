import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Video, User, Check, X, Loader2, CreditCard, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import type { Booking } from '@/types';

export default function UserBookingsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadBookings();
  }, [user, navigate]);

  async function loadBookings() {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('bookings')
      .select('*, provider:provider_profiles(business_name, avatar_url, slug, phone)')
      .eq('client_id', user.id)
      .order('scheduled_at', { ascending: true });

    if (data) {
      setBookings(data as Booking[]);
    }
    setLoading(false);
  }

  async function cancelBooking(bookingId: string) {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (!error) {
      await loadBookings();
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  const statusInfo: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-warning-50 text-warning-700' },
    confirmed: { label: 'Confirmée', color: 'bg-success-50 text-success-700' },
    completed: { label: 'Terminée', color: 'bg-primary-50 text-primary-700' },
    cancelled: { label: 'Annulée', color: 'bg-neutral-100 text-neutral-600' },
    rejected: { label: 'Refusée', color: 'bg-error-50 text-error-700' },
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Mes réservations</h1>
        <p className="mt-1 text-neutral-600">Gérez vos rendez-vous avec les prestataires</p>
      </div>

      {bookings.length === 0 ? (
        <div className="card p-8 text-center">
          <Calendar size={48} className="mx-auto text-neutral-300" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">Aucune réservation</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Vous n'avez pas encore de réservation. Trouvez un prestataire pour commencer.
          </p>
          <button
            onClick={() => navigate('/search')}
            className="btn-primary mt-6"
          >
            Rechercher un prestataire
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const status = statusInfo[booking.status] || statusInfo.pending;
            const provider = booking.provider as any;

            return (
              <div key={booking.id} className="card p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {provider?.avatar_url ? (
                    <img
                      src={provider.avatar_url}
                      alt=""
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-2xl font-bold text-primary-700">
                      {provider?.business_name?.[0] || '?'}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-neutral-900">{provider?.business_name || 'Prestataire'}</h3>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(booking.scheduled_at).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(booking.scheduled_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            {booking.location_type === 'remote' ? (
                              <Video size={14} />
                            ) : booking.location_type === 'in_person' ? (
                              <MapPin size={14} />
                            ) : (
                              <User size={14} />
                            )}
                            {booking.location_type === 'remote'
                              ? 'À distance'
                              : booking.location_type === 'in_person'
                              ? 'En personne'
                              : 'Hybride'}
                          </span>
                        </div>
                      </div>
                      <span className={`badge ${status.color} w-fit`}>{status.label}</span>
                    </div>

                    {booking.service_type && (
                      <p className="mt-2 text-sm text-neutral-600">Service: {booking.service_type}</p>
                    )}

                    {booking.notes && (
                      <p className="mt-2 text-sm text-neutral-500 italic">Note: {booking.notes}</p>
                    )}

                    {booking.location_address && (
                      <p className="mt-2 text-sm text-neutral-600 flex items-center gap-1">
                        <MapPin size={14} />
                        {booking.location_address}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {booking.price && (
                        <span className="text-sm font-semibold text-neutral-900">
                          {booking.price} {booking.currency}
                        </span>
                      )}
                      {booking.payment_method && (
                        <span className="text-xs text-neutral-500">
                          ({booking.payment_method === 'cash' ? 'Espèces' : booking.payment_method === 'card' ? 'Carte' : 'Virement'})
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => navigate(`/messages`)}
                          className="btn-secondary text-xs"
                        >
                          <MessageCircle size={14} />
                          Contacter le prestataire
                        </button>
                      )}
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="btn-secondary text-xs text-error-600 hover:bg-error-50"
                        >
                          <X size={14} />
                          Annuler
                        </button>
                      )}
                      {provider?.slug && (
                        <button
                          onClick={() => navigate(`/provider/${provider.slug}`)}
                          className="btn-secondary text-xs"
                        >
                          Voir le profil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
