import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Video, User, Check, X, Loader2 } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'bank_transfer'>('cash');
  const [price, setPrice] = useState<number>(0);

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
      price: price,
      currency: 'EUR',
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
    });

    if (error) {
      console.error('Error creating booking:', error);
      alert(t.common.error);
      setSubmitting(false);
    } else {
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
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{t.booking.title}</h1>
        <p className="mt-1 text-neutral-600">{t.booking.with} {provider.business_name}</p>
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

                <div className="rounded-lg bg-primary-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700">{t.booking.totalPrice}</span>
                    <span className="text-lg font-semibold text-primary-700">{price}€</span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {t.booking.durationLabel} {duration} min
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                <button onClick={() => setStep('select')} className="btn-secondary w-full sm:w-auto">
                  {t.booking.cancel}
                </button>
                <button
                  onClick={handleSubmitBooking}
                  disabled={submitting || ((locationType === 'in_person' || locationType === 'hybrid') && !address)}
                  className="btn-primary w-full sm:w-auto"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : t.booking.confirmButton}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
