import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getStripe, formatPrice } from '@/lib/stripe';
import { createPaymentIntent, createPaymentRecord, updatePaymentStatus } from '@/services/paymentService';
import { createNotification } from '@/services/notificationService';
import { sendBookingConfirmationEmail, sendNewBookingEmail } from '@/services/emailService';

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [step, setStep] = useState<'select' | 'confirm' | 'payment' | 'success'>('select');
  const [notes, setNotes] = useState('');
  const [locationType, setLocationType] = useState<'in_person' | 'remote'>('in_person');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [price] = useState(50); // Default price, should come from provider

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

  async function handleSubmitBooking() {
    if (!user || !provider || !selectedSlot) return;
    setSubmitting(true);

    const bookingDate = new Date(selectedSlot.date);
    const [hours, minutes] = selectedSlot.start_time.split(':');
    bookingDate.setHours(parseInt(hours), parseInt(minutes));

    const { data: booking, error } = await supabase.from('bookings').insert({
      client_id: user.id,
      provider_id: provider.id,
      service_type: 'Consultation',
      scheduled_at: bookingDate.toISOString(),
      duration_minutes: 60,
      location_type: locationType,
      location_address: locationType === 'in_person' ? address : null,
      notes: notes || null,
      status: 'pending',
      price: price,
      currency: 'EUR',
    }).select().single();

    if (error) {
      console.error('Error creating booking:', error);
      alert('Erreur lors de la création du rendez-vous');
      setSubmitting(false);
      return;
    }

    setBookingId(booking.id);
    setStep('payment');
    setSubmitting(false);
  }

  async function handlePayment() {
    if (!bookingId || !user) return;
    setProcessingPayment(true);

    try {
      // Create payment intent
      const paymentIntent = await createPaymentIntent({
        booking_id: bookingId,
        amount: price,
        currency: 'EUR',
        payment_method: 'card',
      });

      if (!paymentIntent) {
        alert('Erreur lors de la création du paiement');
        setProcessingPayment(false);
        return;
      }

      // Create payment record
      await createPaymentRecord({
        booking_id: bookingId,
        user_id: user.id,
        amount: price,
        currency: 'EUR',
        payment_method: 'card',
        provider_payment_id: paymentIntent.id,
      });

      // Confirm payment with Stripe
      const stripe = await getStripe();
      if (!stripe) {
        alert('Erreur lors du chargement de Stripe');
        setProcessingPayment(false);
        return;
      }

      const { error: stripeError } = await stripe.confirmCardPayment(paymentIntent.client_secret, {
        payment_method: {
          card: {
            // In a real app, you would collect card details with Stripe Elements
            // For now, we'll use a test card
          },
        },
      });

      if (stripeError) {
        console.error('Stripe error:', stripeError);
        await updatePaymentStatus(paymentIntent.id, 'failed');
        alert('Erreur lors du paiement: ' + stripeError.message);
        setProcessingPayment(false);
      } else {
        await updatePaymentStatus(paymentIntent.id, 'completed');
        
        // Create notification for the user
        await createNotification(
          user.id,
          'booking_confirmed',
          'Réservation confirmée',
          `Votre réservation avec ${provider.business_name} a été confirmée avec succès.`,
          { booking_id: bookingId, provider_id: provider.id }
        );
        
        // Create notification for the provider
        const { data: providerProfile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', provider.user_id)
          .single();
        
        if (providerProfile) {
          await createNotification(
            providerProfile.id,
            'new_booking',
            'Nouvelle réservation',
            `Vous avez une nouvelle réservation de ${profile?.full_name || 'un client'}.`,
            { booking_id: bookingId, user_id: user.id }
          );
          
          // Send email notifications
          const bookingDate = selectedSlot ? new Date(selectedSlot.date).toLocaleDateString('fr-FR') : '';
          const bookingTime = selectedSlot ? selectedSlot.time : '';
          
          await sendBookingConfirmationEmail(
            user.email!,
            profile?.full_name || 'Client',
            provider.business_name,
            bookingDate,
            bookingTime
          );
          
          await sendNewBookingEmail(
            providerProfile.email,
            provider.business_name,
            profile?.full_name || 'Client',
            bookingDate,
            bookingTime
          );
        }
        
        setStep('success');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Erreur lors du paiement');
      setProcessingPayment(false);
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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Réserver un rendez-vous</h1>
        <p className="mt-1 text-neutral-600">avec {provider.business_name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Provider Info */}
        <div className="md:col-span-1">
          <div className="card p-6">
            {provider.avatar_url ? (
              <img src={provider.avatar_url} alt="" className="h-24 w-24 rounded-2xl object-cover mx-auto" />
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-primary-100 text-3xl font-bold text-primary-700">
                {provider.business_name[0]}
              </div>
            )}
            <h3 className="mt-4 text-center font-semibold text-neutral-900">{provider.business_name}</h3>
            <p className="mt-1 text-center text-sm text-neutral-600">{provider.headline}</p>
            {provider.city && (
              <div className="mt-3 flex items-center justify-center gap-1 text-sm text-neutral-500">
                <MapPin size={14} />
                {provider.city}
              </div>
            )}
          </div>
        </div>

        {/* Booking Form */}
        <div className="md:col-span-2">
          {step === 'select' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Choisir un créneau</h3>
              
              {slots.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={48} className="mx-auto text-neutral-300" />
                  <p className="mt-3 text-neutral-600">Aucun créneau disponible</p>
                  <p className="text-sm text-neutral-400">Le prestataire n'a pas encore défini ses disponibilités</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full flex items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                        selectedSlot?.id === slot.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-neutral-900">
                          {new Date(slot.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Clock size={14} />
                          {slot.start_time} - {slot.end_time}
                        </div>
                      </div>
                      {selectedSlot?.id === slot.id && (
                        <Check size={20} className="text-primary-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end">
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
            <div className="card p-6">
              <button onClick={() => setStep('select')} className="text-sm text-neutral-600 hover:text-neutral-900 mb-4">
                ← Retour aux créneaux
              </button>

              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Confirmer le rendez-vous</h3>

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
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setLocationType('in_person')}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
                        locationType === 'in_person'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <MapPin size={18} />
                      En personne
                    </button>
                    <button
                      onClick={() => setLocationType('remote')}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
                        locationType === 'remote'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <Video size={18} />
                      Visio
                    </button>
                  </div>
                </div>

                {locationType === 'in_person' && (
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

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setStep('select')} className="btn-secondary">
                  Annuler
                </button>
                <button
                  onClick={handleSubmitBooking}
                  disabled={submitting || (locationType === 'in_person' && !address)}
                  className="btn-primary"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Continuer vers le paiement'}
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="card p-6">
              <button onClick={() => setStep('confirm')} className="text-sm text-neutral-600 hover:text-neutral-900 mb-4">
                ← Retour aux détails
              </button>

              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Paiement</h3>

              <div className="space-y-4">
                <div className="rounded-lg bg-neutral-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-neutral-900">Montant à payer</div>
                      <div className="text-sm text-neutral-600">Consultation avec {provider?.business_name}</div>
                    </div>
                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(price, 'EUR')}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-neutral-200 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard size={24} className="text-neutral-600" />
                    <div>
                      <div className="font-medium text-neutral-900">Carte bancaire</div>
                      <div className="text-sm text-neutral-600">Paiement sécurisé via Stripe</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="label">Numéro de carte</label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        className="input-field"
                        disabled={processingPayment}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Date d'expiration</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          className="input-field"
                          disabled={processingPayment}
                        />
                      </div>
                      <div>
                        <label className="label">CVC</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="input-field"
                          disabled={processingPayment}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-neutral-500">
                  <p>🔒 Paiement sécurisé. Vos informations de carte sont cryptées et ne sont jamais stockées sur nos serveurs.</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setStep('confirm')} className="btn-secondary" disabled={processingPayment}>
                  Annuler
                </button>
                <button
                  onClick={handlePayment}
                  disabled={processingPayment}
                  className="btn-primary"
                >
                  {processingPayment ? <Loader2 size={18} className="animate-spin" /> : <><CreditCard size={18} /> Payer {formatCurrency(price, 'EUR')}</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
