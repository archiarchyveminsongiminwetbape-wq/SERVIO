import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit2, LogOut, Save, X, Camera, Globe, CreditCard, Bell, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { countries } from '@/data/countries';
import { currencies } from '@/data/currencies';
import ImageUpload from '@/components/ImageUpload';

export default function UserProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
    country: '',
    currency: '',
    language: 'fr',
    email_notifications: true,
    push_notifications: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || '',
        country: (profile as any).country || 'FR',
        currency: (profile as any).currency || 'EUR',
        language: (profile as any).language || 'fr',
        email_notifications: (profile as any).email_notifications !== false,
        push_notifications: (profile as any).push_notifications || false,
      });
    }
  }, [profile]);

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        avatar_url: formData.avatar_url,
        country: formData.country,
        currency: formData.currency,
        language: formData.language,
        email_notifications: formData.email_notifications,
        push_notifications: formData.push_notifications,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour du profil');
    } else {
      await refreshProfile();
      setEditing(false);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      avatar_url: profile.avatar_url || '',
      country: (profile as any).country || 'FR',
      currency: (profile as any).currency || 'EUR',
      language: (profile as any).language || 'fr',
      email_notifications: (profile as any).email_notifications !== false,
      push_notifications: (profile as any).push_notifications || false,
    });
    setEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Mon Profil</h1>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="btn-secondary"
              >
                <X size={18} />
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? <span className="animate-spin">⏳</span> : <><Save size={18} /> Enregistrer</>}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary"
            >
              <Edit2 size={18} />
              Modifier
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="card overflow-hidden">
            <div className="relative h-32 bg-gradient-to-br from-primary-600 to-primary-800">
              {editing && (
                <div className="absolute right-2 top-2">
                  <ImageUpload
                    currentUrl={null}
                    userId={user.id}
                    type="banner"
                    aspectRatio="wide"
                    onUrlChange={() => {}}
                    label=""
                  />
                </div>
              )}
            </div>
            <div className="px-6 pb-6">
              <div className="-mt-12 mb-4 flex justify-center">
                {editing ? (
                  <ImageUpload
                    currentUrl={formData.avatar_url}
                    userId={user.id}
                    type="avatar"
                    aspectRatio="square"
                    onUrlChange={(url) => setFormData({ ...formData, avatar_url: url || '' })}
                    label=""
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full border-4 border-white bg-neutral-200 flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name || 'Avatar'} className="h-full w-full object-cover" />
                    ) : (
                      <User size={48} className="text-neutral-400" />
                    )}
                  </div>
                )}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-neutral-900">{profile.full_name || 'Utilisateur'}</h2>
                <p className="text-sm text-neutral-600">{profile.email}</p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  <Shield size={12} />
                  {profile.role === 'admin' ? 'Administrateur' : profile.role === 'provider' ? 'Prestataire' : 'Client'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 card">
            <h3 className="mb-4 font-semibold text-neutral-900">Actions rapides</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/favorites')}
                className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <span className="text-lg">⭐</span>
                Mes favoris
              </button>
              <button
                onClick={() => navigate('/messages')}
                className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <span className="text-lg">💬</span>
                Mes messages
              </button>
              {profile.role === 'provider' && (
                <button
                  onClick={() => navigate('/provider/dashboard')}
                  className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <span className="text-lg">📊</span>
                  Dashboard prestataire
                </button>
              )}
              {profile.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <span className="text-lg">🔧</span>
                  Administration
                </button>
              )}
              <hr className="my-2 border-neutral-200" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-error-600 hover:bg-error-50"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <h3 className="mb-4 font-semibold text-neutral-900">Informations personnelles</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">Nom complet</p>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-neutral-900">{profile.full_name || 'Non renseigné'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">Email</p>
                  <p className="text-sm font-medium text-neutral-900">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">Téléphone</p>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="+33 6 12 34 56 78"
                    />
                  ) : (
                    <p className="text-sm font-medium text-neutral-900">{profile.phone || 'Non renseigné'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">Pays</p>
                  {editing ? (
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-neutral-900">
                      {countries.find(c => c.code === formData.country)?.name || 'Non renseigné'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">Devise préférée</p>
                  {editing ? (
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-neutral-900">
                      {currencies.find(c => c.code === formData.currency)?.symbol} {currencies.find(c => c.code === formData.currency)?.name || 'Non renseigné'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">Langue</p>
                  {editing ? (
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="de">Deutsch</option>
                      <option value="it">Italiano</option>
                      <option value="pt">Português</option>
                      <option value="ar">العربية</option>
                      <option value="zh">中文</option>
                      <option value="ja">日本語</option>
                      <option value="ko">한국어</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-neutral-900">
                      {formData.language === 'fr' ? 'Français' : 
                       formData.language === 'en' ? 'English' :
                       formData.language === 'es' ? 'Español' :
                       formData.language === 'de' ? 'Deutsch' :
                       formData.language === 'it' ? 'Italiano' :
                       formData.language === 'pt' ? 'Português' :
                       formData.language === 'ar' ? 'العربية' :
                       formData.language === 'zh' ? '中文' :
                       formData.language === 'ja' ? '日本語' :
                       formData.language === 'ko' ? '한국어' : 'Français'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">Membre depuis</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">Statut du compte</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    profile.status === 'active' 
                      ? 'bg-success-50 text-success-700' 
                      : profile.status === 'suspended'
                      ? 'bg-warning-50 text-warning-700'
                      : 'bg-error-50 text-error-700'
                  }`}>
                    {profile.status === 'active' ? 'Actif' : profile.status === 'suspended' ? 'Suspendu' : 'Banni'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="card">
            <h3 className="mb-4 font-semibold text-neutral-900">Paramètres du compte</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <Lock size={16} />
                  <span>Changer mon mot de passe</span>
                </div>
                <span className="text-neutral-400">→</span>
              </button>
              
              {editing && (
                <>
                  <div className="flex items-center justify-between rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Bell size={16} />
                      <span className="text-sm text-neutral-700">Notifications par email</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.email_notifications}
                        onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Bell size={16} />
                      <span className="text-sm text-neutral-700">Notifications push</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.push_notifications}
                        onChange={(e) => setFormData({ ...formData, push_notifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </>
              )}
              
              <button className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50">
                <span>Confidentialité des données</span>
                <span className="text-neutral-400">→</span>
              </button>
              <button className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50">
                <span>Conditions d'utilisation</span>
                <span className="text-neutral-400">→</span>
              </button>
              <button className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50">
                <span>Politique de confidentialité</span>
                <span className="text-neutral-400">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
