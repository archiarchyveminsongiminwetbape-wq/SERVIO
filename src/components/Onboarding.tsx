import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Search, Heart, MessageSquare, Check, Sparkles, Briefcase, MapPin, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { supabase } from '@/lib/supabase';

type Step = 'welcome' | 'role' | 'interests' | 'location' | 'complete';

interface OnboardingData {
  role: 'visitor' | 'provider';
  interests: string[];
  location: string;
}

export default function Onboarding() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    role: 'visitor',
    interests: [],
    location: '',
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'dev', name: 'Développement', icon: Briefcase },
    { id: 'design', name: 'Design', icon: Sparkles },
    { id: 'marketing', name: 'Marketing', icon: Star },
    { id: 'writing', name: 'Rédaction', icon: MessageSquare },
    { id: 'consulting', name: 'Conseil', icon: Search },
    { id: 'other', name: 'Autre', icon: Heart },
  ];

  useEffect(() => {
    // Check if user has already completed onboarding
    const checkOnboarding = async () => {
      if (profile?.onboarding_completed) {
        navigate('/');
      }
    };
    checkOnboarding();
  }, [profile, navigate]);

  const handleNext = () => {
    if (step === 'welcome') setStep('role');
    else if (step === 'role') setStep('interests');
    else if (step === 'interests') setStep('location');
    else if (step === 'location') handleComplete();
  };

  const handleBack = () => {
    if (step === 'role') setStep('welcome');
    else if (step === 'interests') setStep('role');
    else if (step === 'location') setStep('interests');
  };

  const toggleInterest = (categoryId: string) => {
    setOnboardingData(prev => ({
      ...prev,
      interests: prev.interests.includes(categoryId)
        ? prev.interests.filter(id => id !== categoryId)
        : [...prev.interests, categoryId],
    }));
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Update profile with onboarding data
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_data: onboardingData,
          role: onboardingData.role,
        })
        .eq('id', user.id);

      if (error) throw error;

      setStep('complete');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        if (onboardingData.role === 'provider') {
          navigate('/provider/dashboard');
        } else {
          navigate('/search');
        }
      }, 2000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const skipOnboarding = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      navigate('/');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
              <Sparkles size={40} />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-neutral-900">
              Bienvenue sur SERVIO !
            </h2>
            <p className="mb-8 text-neutral-600">
              Trouvez le bon prestataire. Voyez son travail. Réservez en confiance.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Search, label: 'Trouvez' },
                { icon: Eye, label: 'Vérifiez' },
                { icon: Check, label: 'Réservez' },
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mist text-blue-600">
                    <item.icon size={24} />
                  </div>
                  <span className="text-sm font-medium text-neutral-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'role':
        return (
          <div>
            <h2 className="mb-3 text-xl font-bold text-neutral-900">
              Comment souhaitez-vous utiliser SERVIO ?
            </h2>
            <p className="mb-6 text-neutral-600">
              Sélectionnez votre rôle principal
            </p>
            <div className="space-y-3">
              {[
                {
                  id: 'visitor',
                  title: 'Je cherche un prestataire',
                  description: 'Trouvez des professionnels qualifiés pour vos projets',
                  icon: Search,
                },
                {
                  id: 'provider',
                  title: 'Je propose mes services',
                  description: 'Affichez votre portfolio et trouvez des clients',
                  icon: Briefcase,
                },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setOnboardingData(prev => ({ ...prev, role: option.id as any }))}
                  className={`w-full flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                    onboardingData.role === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    onboardingData.role === option.id ? 'bg-blue-500 text-white' : 'bg-mist text-blue-600'
                  }`}>
                    <option.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{option.title}</h3>
                    <p className="text-sm text-neutral-600">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'interests':
        return (
          <div>
            <h2 className="mb-3 text-xl font-bold text-neutral-900">
              Quels services vous intéressent ?
            </h2>
            <p className="mb-6 text-neutral-600">
              Sélectionnez au moins une catégorie (optionnel)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = onboardingData.interests.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleInterest(category.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <Icon size={24} />
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'location':
        return (
          <div>
            <h2 className="mb-3 text-xl font-bold text-neutral-900">
              Où êtes-vous situé ?
            </h2>
            <p className="mb-6 text-neutral-600">
              Nous vous recommanderons des prestataires près de chez vous
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Ville ou région
                </label>
                <input
                  type="text"
                  value={onboardingData.location}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Douala, Yaoundé, Paris..."
                  className="input-field"
                />
              </div>
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        // Reverse geocoding would go here
                        setOnboardingData(prev => ({ ...prev, location: 'Position détectée' }));
                      },
                      () => {
                        console.log('Geolocation denied');
                      }
                    );
                  }
                }}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <MapPin size={16} />
                Utiliser ma position actuelle
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success-100 text-success-600">
              <Check size={40} />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-neutral-900">
              Tout est prêt !
            </h2>
            <p className="mb-6 text-neutral-600">
              {onboardingData.role === 'provider'
                ? 'Vous allez être redirigé vers votre tableau de bord prestataire.'
                : 'Vous allez être redirigé vers la recherche de prestataires.'}
            </p>
            {loading && (
              <div className="flex items-center justify-center gap-2 text-neutral-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span className="text-sm">Chargement...</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mist to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button
          onClick={skipOnboarding}
          className="absolute top-4 right-4 text-sm text-neutral-500 hover:text-neutral-700"
        >
          Passer
        </button>

        <div className="card p-6 sm:p-8">
          {/* Progress indicator */}
          {step !== 'complete' && (
            <div className="mb-8">
              <div className="mb-2 flex justify-between text-xs text-neutral-500">
                <span>Étape {['welcome', 'role', 'interests', 'location'].indexOf(step) + 1} sur 4</span>
                <span>{Math.round((['welcome', 'role', 'interests', 'location'].indexOf(step) + 1) / 4 * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                  style={{
                    width: `${(['welcome', 'role', 'interests', 'location'].indexOf(step) + 1) / 4 * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {renderStep()}

          {/* Navigation buttons */}
          {step !== 'complete' && step !== 'welcome' && (
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 btn-secondary"
              >
                <ChevronLeft size={18} />
                Retour
              </button>
              <button
                onClick={handleNext}
                disabled={loading || (step === 'role' && !onboardingData.role)}
                className="flex-1 btn-primary"
              >
                {loading ? (
                  'Chargement...'
                ) : (
                  <>
                    {step === 'location' ? 'Terminer' : 'Continuer'}
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'welcome' && (
            <div className="mt-8">
              <button
                onClick={handleNext}
                className="w-full btn-primary"
              >
                Commencer
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
