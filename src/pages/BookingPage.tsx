import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Video, User, Check, X, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { sendEmail, generateBookingRequestEmail } from '@/lib/email';
import type { ProviderProfile, Booking, AvailabilitySlot } from '@/types';

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const { t, locale } = useI18n();
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'bank_transfer' | 'orange_money' | 'mtn_money'>('cash');
  const [price, setPrice] = useState<number>(0);
  const [quoteAccepted, setQuoteAccepted] = useState(false);

  const exportQuote = () => {
    if (!provider || !selectedSlot) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('SERVIO - Devis de mission', 14, 20);
    doc.setFontSize(11);
    doc.text(`Référence: ${quoteReference}`, 14, 32);
    doc.text(`Prestataire: ${provider.business_name}`, 14, 40);
    doc.text(`Client: ${profile?.full_name || 'Client SERVIO'}`, 14, 48);
    doc.text(`Service: ${serviceType || 'Consultation'}`, 14, 56);
    doc.text(`Date: ${new Date(selectedSlot.date).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 64);
    doc.text(`Horaire: ${selectedSlot.start_time} - ${selectedSlot.end_time}`, 14, 72);
    doc.text(`Durée: ${duration} minutes`, 14, 80);
    doc.text(`Mode: ${locationType === 'remote' ? 'À distance' : locationType === 'in_person' ? 'En présentiel' : 'Hybride'}`, 14, 88);
    doc.text(`Montant: ${price}€`, 14, 96);
    doc.text(`Paiement: ${paymentMethod === 'cash' ? 'Espèces / paiement direct' : paymentMethod === 'card' ? 'Carte bancaire' : paymentMethod === 'orange_money' ? 'Orange Money' : paymentMethod === 'mtn_money' ? 'MTN Money' : 'Virement bancaire'}`, 14, 104);
    doc.text('Escrow: Sécurisé par SERVIO — paiement retenu jusqu’à validation finale de la mission.', 14, 112);
    doc.text('Signature client: ______________________________', 14, 140);
    doc.text(`Notes: ${notes || 'Aucune note particulière'}`, 14, 150, { maxWidth: 180 });
    doc.save(`devis-${provider.business_name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  useEffect(() => {
    if (!slug) return;
    loadProvider();
  }, [slug]);

  async function loadProvider() {
    if (!slug) return;
    setLoading(true);
    const { data } = await supabase
      .from('provider_profiles')
      .select('id, user_id, business_name, headline, avatar_url, banner_url, city, country, remote_service, skills, badges, rating_avg, rating_count, price_range, availability, slug, category_id, experience_years, languages, validation_status, is_featured, description, website, phone, social_links, created_at, updated_at, category:categories(id, name, slug), certifications, service_area, validation_note, validated_at, validated_by, profile_views, currency, review_count, availability_schedule')
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
    { value: 30, label: t.booking.minutes30, price: 50 },
    { value: 45, label: t.booking.minutes45, price: 75 },
    { value: 60, label: t.booking.hour1, price: 100 },
    { value: 90, label: t.booking.hour1half, price: 150 },
    { value: 120, label: t.booking.hours2, price: 200 },
    { value: 180, label: t.booking.hours3, price: 300 },
  ];

  useEffect(() => {
    const selectedOption = getDurationOptions().find(opt => opt.value === duration);
    if (selectedOption) {
      setPrice(selectedOption.price);
    }
  }, [duration]);

  const quoteReference = `SERV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  async function handleSubmitBooking() {
    if (!user || !provider || !selectedSlot || !quoteAccepted) return;
    setSubmitting(true);

    const bookingDate = new Date(selectedSlot.date);
    const [hours, minutes] = selectedSlot.start_time.split(':');
    bookingDate.setHours(parseInt(hours), parseInt(minutes));

    const secureNotes = [
      notes || '',
      `Devis SERVIO: ${quoteReference}`,
      `Escrow sécurisé: ${paymentMethod === 'cash' ? 'paiement hors escrow' : 'paiement retenu jusqu’à validation de mission'}`,
    ].filter(Boolean).join('\n\n');

    const paymentIntentReference = `pi_${Date.now()}`;
    const contractReference = `CTR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const providerPayment = paymentMethod === 'card' ? 'stripe' : paymentMethod === 'orange_money' ? 'orange_money' : paymentMethod === 'mtn_money' ? 'mtn_money' : 'manual';

    const { data: bookingData, error } = await supabase.from('bookings').insert({
      client_id: user.id,
      provider_id: provider.id,
      service_type: serviceType,
      scheduled_at: bookingDate.toISOString(),
      duration_minutes: duration,
      location_type: locationType,
      location_address: locationType === 'in_person' || locationType === 'hybrid' ? address : null,
      notes: secureNotes || null,
      status: 'pending',
      price: price,
      currency: 'EUR',
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'card' ? 'processing' : paymentMethod === 'cash' ? 'pending' : 'held',
      metadata: {
        payment_intent_reference: paymentIntentReference,
        payment_provider: providerPayment,
        escrow_enabled: true,
        quote_reference: quoteReference,
        contract_reference: contractReference,
        contract_status: 'draft',
        contract_signed_at: null,
        payment_data: {
          method: paymentMethod,
          amount: price,
          currency: 'EUR',
          status: paymentMethod === 'card' ? 'processing' : paymentMethod === 'cash' ? 'pending' : 'held',
        },
      },
    }).select('id').single();

    if (error) {
      console.error('Error creating booking:', error);
      alert(t.common.error);
      setSubmitting(false);
      return;
    }

    if (paymentMethod === 'card') {
      try {
        const response = await fetch('/api/checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: price,
            currency: 'eur',
            bookingId: bookingData?.id,
            userId: user.id,
            providerId: provider.id,
            clientEmail: user.email,
            metadata: {
              payment_intent_reference: paymentIntentReference,
              quote_reference: quoteReference,
              provider_id: provider.id,
              booking_id: bookingData?.id,
            },
          }),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.url) {
          throw new Error(payload?.error || 'Checkout unavailable');
        }

        window.location.href = payload.url;
        return;
      } catch (checkoutError) {
        console.error('Checkout error:', checkoutError);
        await supabase.from('bookings').update({ payment_status: 'failed', status: 'cancelled' }).eq('id', bookingData?.id);
        alert('Le paiement par carte n’a pas pu être démarré. Veuillez réessayer.');
        setSubmitting(false);
        return;
      }
    }

    if (paymentMethod === 'orange_money' || paymentMethod === 'mtn_money') {
      await supabase.from('bookings').update({
        payment_status: 'processing',
        status: 'pending',
        notes: `${secureNotes}\n\nPaiement mobile: ${paymentMethod === 'orange_money' ? 'Orange Money' : 'MTN Money'} — validation manuelle requise.`,
      }).eq('id', bookingData?.id);
    }

    if (provider.user_id) {
      // Send email notification to provider
      if (provider.user_id) {
        const { data: providerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', provider.user_id)
          .single();

        if (providerProfile?.email) {
          const date = new Date(selectedSlot.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          });
          const time = selectedSlot.start_time;
          
          const emailOptions = generateBookingRequestEmail(
            provider.business_name,
            profile?.full_name || 'Client',
            date,
            time,
            serviceType
          );
          emailOptions.to = providerProfile.email;
          await sendEmail(emailOptions);
        }
      }

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
        <p className="text-neutral-600">{t.search.noResults}</p>
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
          <h2 className="mt-6 text-2xl font-bold text-neutral-900">{t.booking.successTitle}</h2>
          <p className="mt-2 text-neutral-600">
            {t.booking.successMessage.replace('{provider}', provider.business_name)}
          </p>
          <div className="mt-6 space-y-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Escrow sécurisé activé : le paiement est retenu jusqu’à validation finale de la mission.
            </div>
            <button onClick={exportQuote} className="btn-secondary w-full">
              Télécharger le devis
            </button>
            <button onClick={() => navigate('/messages')} className="btn-primary w-full">
              {t.booking.viewMessages}
            </button>
            <button onClick={() => navigate('/')} className="btn-secondary w-full">
              {t.common.back}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          <span className="h-2 w-2 rounded-full bg-primary-500" />
          {t.booking.title}
        </div>
        <h1 className="text-xl sm:text-3xl font-bold text-neutral-900">{t.booking.title}</h1>
        <p className="mt-2 text-neutral-600">{t.booking.with} {provider.business_name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[0.9fr_1.7fr]">
        {/* Provider Info */}
        <div className="md:col-span-1">
          <div className="overflow-hidden rounded-[28px] border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-cyan-50 p-4 shadow-[0_24px_60px_rgba(59,130,246,0.12)] sm:p-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white p-1 shadow-md sm:h-24 sm:w-24">
              {provider.avatar_url ? (
                <img src={provider.avatar_url} alt="" className="h-full w-full rounded-[22px] object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-gradient-to-br from-primary-500 to-primary-600 text-2xl sm:text-3xl font-bold text-white">
                  {provider.business_name[0]}
                </div>
              )}
            </div>
            <h3 className="mt-4 text-center font-semibold text-neutral-900 text-base sm:text-lg">{provider.business_name}</h3>
            <p className="mt-1 text-center text-sm text-neutral-600">{provider.headline}</p>
            {provider.city && (
              <div className="mt-3 flex items-center justify-center gap-1 text-sm text-neutral-500">
                <MapPin size={14} />
                {provider.city}
              </div>
            )}

            <div className="mt-5 space-y-3 rounded-2xl border border-primary-100 bg-white/80 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Durée</span>
                <span className="font-semibold text-neutral-900">{duration} min</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Tarif</span>
                <span className="font-semibold text-primary-700">{price}€</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Mode</span>
                <span className="font-semibold text-neutral-900">{locationType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="md:col-span-1">
          {step === 'select' && (
            <div className="card p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4">{t.booking.selectSlot}</h3>
              
              <div className="mb-4 sm:mb-6">
                <label className="label">{t.booking.serviceType}</label>
                <input
                  type="text"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="input-field"
                  placeholder={t.booking.serviceTypePlaceholder}
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="label">{t.booking.duration}</label>
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
                  <p className="mt-3 text-sm sm:text-base text-neutral-600">{t.booking.noSlotsAvailable}</p>
                  <p className="text-xs sm:text-sm text-neutral-400">{t.booking.noSlotsSubtext}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="label">{t.booking.date}</label>
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
                          {new Date(date).toLocaleDateString(locale, {
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
                  {t.booking.continue}
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="card p-4 sm:p-6">
              <button onClick={() => setStep('select')} className="text-sm text-neutral-600 hover:text-neutral-900 mb-4">
                {t.booking.backToSlots}
              </button>

              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4">{t.booking.confirmBooking}</h3>

              <div className="space-y-4">
                <div className="rounded-lg bg-neutral-50 p-4">
                  <div className="font-medium text-neutral-900">{t.booking.dateTime}</div>
                  <div className="mt-1 text-sm text-neutral-600">
                    {selectedSlot && (
                      <>
                        {new Date(selectedSlot.date).toLocaleDateString(locale, {
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
                  <label className="label">{t.booking.appointmentType}</label>
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
                      <span className="hidden sm:inline">{t.booking.inPerson}</span>
                      <span className="sm:hidden">{t.booking.inPersonShort}</span>
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
                      {t.booking.remote}
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
                      {t.booking.hybrid}
                    </button>
                  </div>
                </div>

                {(locationType === 'in_person' || locationType === 'hybrid') && (
                  <div>
                    <label className="label">{t.booking.address}</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="input-field"
                      placeholder={t.booking.addressPlaceholder}
                    />
                  </div>
                )}

                <div>
                  <label className="label">{t.booking.notes}</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field resize-none"
                    rows={3}
                    placeholder={t.booking.notesPlaceholder}
                  />
                </div>

                <div>
                  <label className="label">{t.booking.paymentMethod}</label>
                  <div className="mt-2 space-y-2">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                        paymentMethod === 'cash'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-sm text-neutral-700">{t.booking.payCash}</span>
                      {paymentMethod === 'cash' && <Check size={16} className="text-primary-600" />}
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                        paymentMethod === 'card'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-sm text-neutral-700">{t.booking.payCard}</span>
                      {paymentMethod === 'card' && <Check size={16} className="text-primary-600" />}
                    </button>
                    <button
                      onClick={() => setPaymentMethod('orange_money')}
                      className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                        paymentMethod === 'orange_money'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-sm text-neutral-700">Orange Money</span>
                      {paymentMethod === 'orange_money' && <Check size={16} className="text-primary-600" />}
                    </button>
                    <button
                      onClick={() => setPaymentMethod('mtn_money')}
                      className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                        paymentMethod === 'mtn_money'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-sm text-neutral-700">MTN Money</span>
                      {paymentMethod === 'mtn_money' && <Check size={16} className="text-primary-600" />}
                    </button>
                    <button
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-sm text-neutral-700">{t.booking.payBankTransfer}</span>
                      {paymentMethod === 'bank_transfer' && <Check size={16} className="text-primary-600" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">Devis de mission</p>
                      <p className="mt-1 text-sm text-neutral-600">Référence {quoteReference}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary-700">Valable 48h</span>
                  </div>

                  <div className="space-y-2 text-sm text-neutral-700">
                    <div className="flex items-center justify-between gap-3">
                      <span>Service</span>
                      <span className="font-medium text-neutral-900">{serviceType || 'Consultation'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Durée</span>
                      <span className="font-medium text-neutral-900">{duration} min</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Mode</span>
                      <span className="font-medium text-neutral-900">{locationType === 'remote' ? 'À distance' : locationType === 'in_person' ? 'En présentiel' : 'Hybride'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Prix estimé</span>
                      <span className="text-lg font-bold text-primary-700">{price}€</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-primary-200 bg-white/80 p-3 text-xs text-neutral-600">
                    Le prestataire confirme l’intervention sur la date sélectionnée. Le paiement est sécurisé et libéré une fois la mission validée.
                  </div>
                </div>

                <label className="mt-4 flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={quoteAccepted}
                    onChange={(e) => setQuoteAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>
                    J’accepte le devis, la date proposée et les conditions de mission avant validation.
                  </span>
                </label>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                <button onClick={() => setStep('select')} className="btn-secondary w-full sm:w-auto">
                  {t.booking.cancel}
                </button>
                <button
                  onClick={handleSubmitBooking}
                  disabled={submitting || !quoteAccepted || ((locationType === 'in_person' || locationType === 'hybrid') && !address)}
                  className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Valider le devis'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
