import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Video, User, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { ProviderProfile, Booking, AvailabilitySlot } from '@/types';
import { formatCurrency } from '@/data/currencies';

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [notes, setNotes] = useState('');
  const [locationType, setLocationType] = useState<'in_person' | 'remote' | 'hybrid'>('in_person');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serviceType, setServiceType] = useState('Consultation');
  const [duration, setDuration] = useState(60);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    loadProvider();
  }, [slug]);

  async function loadProvider() {
    if (!slug) return;
    setLoading(true);
    const { data } = await supabase
      .from('provider_profiles')
      .select('*, category:categories(*)')
      .eq('slug', slug)
      .single();
    
    if (data) {
      setProvider(data as ProviderProfile);
      loadAvailabilitySlots(data.id);
    }
    setLoading(false);
  }

  async function loadAvailabilitySlots(providerId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('provider_id', providerId)
      .gte('date', today)
      .eq('is_available', true)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (data) {
      setSlots(data as AvailabilitySlot[]);
    }
  }

  const getAvailableDates = () => {
    const uniqueDates = [...new Set(slots.map(slot => slot.date))];
    return uniqueDates.sort();
  };

  const getSlotsForDate = (date: string) => {
    return slots.filter(slot => slot.date === date);
  };

  const getDurationOptions = () => [
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '1 heure' },
    { value: 90, label: '1h30' },
    { value: 120, label: '2 heures' },
    { value: 180, label: '3 heures' },
  ];

  async function handleSubmitBooking() {
    if (!user || !provider || !selectedSlot) return;
    setSubmitting(true);

    const bookingDate = new Date(selectedSlot.date);
    const [hours, minutes] = selectedSlot.start_time.split(':');
    bookingDate.setHours(parseInt(hours), parseInt(minutes));

    const { error } = await supabase.from('bookings').insert({
      client_id: user.id,
      provider_id: provider.id,
      service_type: serviceType,
      scheduled_at: bookingDate.toISOString(),
      duration_minutes: duration,
      location_type: locationType,
      location_address: locationType === 'in_person' || locationType === 'hybrid' ? address : null,
      notes: notes || null,
      status: 'pending',
      price: null,
      currency: 'EUR',
    });

    if (error) {
      console.error('Error creating booking:', error);
      alert('Erreur lors de la création du rendez-vous');
      setSubmitting(false);
    } else {
      setStep('success');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-neutral-600">Prestataire non trouvé</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="card p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-100 text-success-600">
            <Check size={40} />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-neutral-900">Rendez-vous demandé</h2>
          <p className="mt-2 text-neutral-600">
            Votre demande de rendez-vous a été envoyée à {provider.business_name}.
            Vous recevrez une confirmation une fois le rendez-vous accepté.
          </p>
          <div className="mt-6 space-y-2">
            <button onClick={() => navigate('/messages')} className="btn-primary w-full">
              Voir mes messages
            </button>
            <button onClick={() => navigate('/')} className="btn-secondary w-full">
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Réserver un rendez-vous</h1>
        <p className="mt-1 text-neutral-600">avec {provider.business_name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Provider Info */}
        <div className="md:col-span-1">
          <div className="card p-4 sm:p-6">
            {provider.avatar_url ? (
              <img src={provider.avatar_url} alt="" className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover mx-auto" />
            ) : (
              <div className="mx-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-primary-100 text-2xl sm:text-3xl font-bold text-primary-700">
                {provider.business_name[0]}
              </div>
            )}
            <h3 className="mt-3 sm:mt-4 text-center font-semibold text-neutral-900 text-base sm:text-lg">{provider.business_name}</h3>
            <p className="mt-1 text-center text-sm text-neutral-600">{provider.headline}</p>
            {provider.city && (
              <div className="mt-2 sm:mt-3 flex items-center justify-center gap-1 text-sm text-neutral-500">
                <MapPin size={14} />
                {provider.city}
              </div>
            )}
          </div>
        </div>

        {/* Booking Form */}
        <div className="md:col-span-2">
          {step === 'select' && (
            <div className="card p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4">Choisir un créneau</h3>
              
              <div className="mb-4 sm:mb-6">
                <label className="label">Type de service</label>
                <input
                  type="text"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="input-field"
                  placeholder="Ex: Consultation, Audit, Formation..."
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="label">Durée</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {getDurationOptions().map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDuration(opt.value)}
                      className={`px-3 sm:px-4 py-2 rounded-lg border text-sm transition-colors ${
                        duration === opt.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {slots.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Calendar size={40} className="mx-auto text-neutral-300" />
                  <p className="mt-3 text-sm sm:text-base text-neutral-600">Aucun créneau disponible</p>
                  <p className="text-xs sm:text-sm text-neutral-400">Le prestataire n'a pas encore défini ses disponibilités</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="label">Date</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getAvailableDates().map((date) => (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className={`px-3 sm:px-4 py-2 rounded-lg border text-sm transition-colors ${
                            selectedDate === date
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          {new Date(date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
                      {getSlotsForDate(selectedDate).map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full flex items-center justify-between rounded-lg border p-3 sm:p-4 text-left transition-colors ${
                            selectedSlot?.id === slot.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                              <Clock size={14} />
                              {slot.start_time} - {slot.end_time}
                            </div>
                            {slot.notes && (
                              <div className="mt-1 text-xs text-neutral-500">{slot.notes}</div>
                            )}
                          </div>
                          {selectedSlot?.id === slot.id && (
                            <Check size={20} className="text-primary-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="mt-4 sm:mt-6 flex justify-end">
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!selectedSlot}
                  className="btn-primary"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="card p-4 sm:p-6">
              <button onClick={() => setStep('select')} className="text-sm text-neutral-600 hover:text-neutral-900 mb-4">
                ← Retour aux créneaux
              </button>

              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4">Confirmer le rendez-vous</h3>

              <div className="space-y-4">
                <div className="rounded-lg bg-neutral-50 p-4">
                  <div className="font-medium text-neutral-900">Date et heure</div>
                  <div className="mt-1 text-sm text-neutral-600">
                    {selectedSlot && (
                      <>
                        {new Date(selectedSlot.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        <br />
                        {selectedSlot.start_time} - {selectedSlot.end_time}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">Type de rendez-vous</label>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                      onClick={() => setLocationType('in_person')}
                      className={`flex items-center justify-center gap-1 sm:gap-2 rounded-lg border p-2 sm:p-3 text-xs sm:text-sm transition-colors ${
                        locationType === 'in_person'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <MapPin size={16} />
                      <span className="hidden sm:inline">En personne</span>
                      <span className="sm:hidden">Présentiel</span>
                    </button>
                    <button
                      onClick={() => setLocationType('remote')}
                      className={`flex items-center justify-center gap-1 sm:gap-2 rounded-lg border p-2 sm:p-3 text-xs sm:text-sm transition-colors ${
                        locationType === 'remote'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <Video size={16} />
                      Visio
                    </button>
                    <button
                      onClick={() => setLocationType('hybrid')}
                      className={`flex items-center justify-center gap-1 sm:gap-2 rounded-lg border p-2 sm:p-3 text-xs sm:text-sm transition-colors ${
                        locationType === 'hybrid'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <User size={16} />
                      Hybride
                    </button>
                  </div>
                </div>

                {(locationType === 'in_person' || locationType === 'hybrid') && (
                  <div>
                    <label className="label">Adresse</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="input-field"
                      placeholder="Adresse complète"
                    />
                  </div>
                )}

                <div>
                  <label className="label">Notes (optionnel)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Précisez votre demande ou vos questions..."
                  />
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                <button onClick={() => setStep('select')} className="btn-secondary w-full sm:w-auto">
                  Annuler
                </button>
                <button
                  onClick={handleSubmitBooking}
                  disabled={submitting || ((locationType === 'in_person' || locationType === 'hybrid') && !address)}
                  className="btn-primary w-full sm:w-auto"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirmer le rendez-vous'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
