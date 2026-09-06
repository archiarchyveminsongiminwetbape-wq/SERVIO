import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Check, Briefcase, Upload, MapPin, Clock, Star, FileText, Sparkles, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { supabase } from '@/lib/supabase';

type Step = 'welcome' | 'business' | 'services' | 'portfolio' | 'availability' | 'complete';

interface ProviderOnboardingData {
  business_name: string;
  headline: string;
  description: string;
  category_id: string;
  services: Array<{ name: string; price: string; duration: string }>;
  availability_schedule: any;
}

export default function ProviderOnboarding() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [onboardingData, setOnboardingData] = useState<ProviderOnboardingData>({
    business_name: '',
    headline: '',
    description: '',
    category_id: '',
    services: [{ name: '', price: '', duration: '' }],
    availability_schedule: {},
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(data || []);
  };

  const handleNext = () => {
    if (step === 'welcome') setStep('business');
    else if (step === 'business') setStep('services');
    else if (step === 'services') setStep('portfolio');
    else if (step === 'portfolio') setStep('availability');
    else if (step === 'availability') handleComplete();
  };

  const handleBack = () => {
    if (step === 'business') setStep('welcome');
    else if (step === 'services') setStep('business');
    else if (step === 'portfolio') setStep('services');
    else if (step === 'availability') setStep('portfolio');
  };

  const addService = () => {
    setOnboardingData(prev => ({
      ...prev,
      services: [...prev.services, { name: '', price: '', duration: '' }],
    }));
  };

  const updateService = (index: number, field: string, value: string) => {
    setOnboardingData(prev => ({
      ...prev,
      services: prev.services.map((s, i) => 
        i === index ? { ...s, [field]: value } : s
      ),
    }));
  };

  const removeService = (index: number) => {
    setOnboardingData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Create or update provider profile
      const { error: profileError } = await supabase
        .from('provider_profiles')
        .upsert({
          user_id: user.id,
          business_name: onboardingData.business_name,
          headline: onboardingData.headline,
          description: onboardingData.description,
          category_id: onboardingData.category_id,
          availability_schedule: onboardingData.availability_schedule,
          validation_status: 'pending',
          onboarding_completed: true,
        });

      if (profileError) throw profileError;

      // Create services
      for (const service of onboardingData.services) {
        if (service.name) {
          await supabase.from('services').insert({
            provider_id: user.id,
            name: service.name,
            price: parseFloat(service.price) || 0,
            duration: parseInt(service.duration) || 60,
          });
        }
      }

      setStep('complete');
      
      setTimeout(() => {
        navigate('/provider/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error completing provider onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
              <Briefcase size={40} />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-neutral-900">
              Configurez votre profil prestataire
            </h2>
            <p className="mb-8 text-neutral-600">
              Quelques étapes pour commencer à recevoir des demandes de clients
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
              {[
                { icon: FileText, label: 'Informations business', desc: 'Nom, description, catégorie' },
                { icon: Sparkles, label: 'Vos services', desc: 'Prix, durée, détails' },
                { icon: Upload, label: 'Portfolio', desc: 'Photos de vos réalisations' },
                { icon: Clock, label: 'Disponibilités', desc: 'Vos horaires de travail' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-mist">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-900 block">{item.label}</span>
                    <span className="text-xs text-neutral-600">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'business':
        return (
          <div>
            <h2 className="mb-3 text-xl font-bold text-neutral-900">
              Informations business
            </h2>
            <p className="mb-6 text-neutral-600">
              Présentez votre activité aux clients
            </p>
            <div className="space-y-4">
              <div>
                <label className="label">Nom de votre business</label>
                <input
                  type="text"
                  value={onboardingData.business_name}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="Ex: Studio Design Pro"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Phrase d'accroche</label>
                <input
                  type="text"
                  value={onboardingData.headline}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, headline: e.target.value }))}
                  placeholder="Ex: Designer freelance spécialisé en branding"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={onboardingData.description}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez votre expertise, votre approche et ce qui vous rend unique..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
              <div>
                <label className="label">Catégorie principale</label>
                <select
                  value={onboardingData.category_id}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 'services':
        return (
          <div>
            <h2 className="mb-3 text-xl font-bold text-neutral-900">
              Vos services
            </h2>
            <p className="mb-6 text-neutral-600">
              Définissez les services que vous proposez
            </p>
            <div className="space-y-4">
              {onboardingData.services.map((service, index) => (
                <div key={index} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-neutral-900">Service {index + 1}</span>
                    {onboardingData.services.length > 1 && (
                      <button
                        onClick={() => removeService(index)}
                        className="text-sm text-error-600 hover:text-error-700"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="label">Nom du service</label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => updateService(index, 'name', e.target.value)}
                        placeholder="Ex: Logo Design"
                        className="input-field"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Prix (FCFA)</label>
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) => updateService(index, 'price', e.target.value)}
                          placeholder="50000"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="label">Durée (minutes)</label>
                        <input
                          type="number"
                          value={service.duration}
                          onChange={(e) => updateService(index, 'duration', e.target.value)}
                          placeholder="60"
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addService}
                className="w-full btn-secondary"
              >
                <Plus size={18} />
                Ajouter un service
              </button>
            </div>
          </div>
        );

      case 'portfolio':
        return (
          <div>
            <h2 className="mb-3 text-xl font-bold text-neutral-900">
              Portfolio
            </h2>
            <p className="mb-6 text-neutral-600">
              Ajoutez vos réalisations (optionnel pour le moment)
            </p>
            <div className="card flex flex-col items-center justify-center py-12 text-center border-dashed">
              <Upload size={48} className="text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-600 mb-2">
                Vous pourrez ajouter votre portfolio plus tard
              </p>
              <p className="text-xs text-neutral-500">
                Glissez-déposez vos images ou cliquez pour parcourir
              </p>
            </div>
          </div>
        );

      case 'availability':
        return (
          <div>
            <h2 className="mb-3 text-xl font-bold text-neutral-900">
              Disponibilités
            </h2>
            <p className="mb-6 text-neutral-600">
              Définissez vos horaires de travail (optionnel)
            </p>
            <div className="card p-4">
              <p className="text-sm text-neutral-600 mb-4">
                Vous pourrez configurer vos disponibilités détaillées dans votre tableau de bord
              </p>
              <div className="flex items-center gap-2 text-blue-600">
                <Calendar size={16} />
                <span className="text-sm">Configuration avancée disponible après l'inscription</span>
              </div>
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
              Profil créé avec succès !
            </h2>
            <p className="mb-6 text-neutral-600">
              Votre profil est en attente de validation par notre équipe.
            </p>
            {loading && (
              <div className="flex items-center justify-center gap-2 text-neutral-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span className="text-sm">Redirection vers le tableau de bord...</span>
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
          onClick={() => navigate('/provider/dashboard')}
          className="absolute top-4 right-4 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <X size={20} />
        </button>

        <div className="card p-6 sm:p-8">
          {/* Progress indicator */}
          {step !== 'complete' && (
            <div className="mb-8">
              <div className="mb-2 flex justify-between text-xs text-neutral-500">
                <span>Étape {['welcome', 'business', 'services', 'portfolio', 'availability'].indexOf(step) + 1} sur 5</span>
                <span>{Math.round((['welcome', 'business', 'services', 'portfolio', 'availability'].indexOf(step) + 1) / 5 * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                  style={{
                    width: `${(['welcome', 'business', 'services', 'portfolio', 'availability'].indexOf(step) + 1) / 5 * 100}%`,
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
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? (
                  'Chargement...'
                ) : (
                  <>
                    {step === 'availability' ? 'Terminer' : 'Continuer'}
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
