import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit2, LogOut, Save, X, Camera, Globe, CreditCard, Bell, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { uploadAvatar, uploadBanner } from '@/lib/storage';
import type { Profile } from '@/types';
import { countries } from '@/data/countries';
import { currencies } from '@/data/currencies';

export default function UserProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { t, locale, supportedLanguages } = useI18n();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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

      // Load banner if provider
      if (profile.role === 'provider') {
        supabase
          .from('provider_profiles')
          .select('banner_url')
          .eq('user_id', profile.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.banner_url) {
              setBannerUrl(data.banner_url);
            }
          });
      }
    }
  }, [profile]);

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const selectedCountry = countries.find((country) => country.code === formData.country);
  const selectedCurrency = currencies.find((currency) => currency.code === formData.currency);

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
      alert(t.common.error);
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

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    setUploadMessage(null);
    try {
      const publicUrl = await uploadAvatar(file, user.id);
      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // If user is provider, also update provider_profiles table
      if (profile?.role === 'provider') {
        await supabase
          .from('provider_profiles')
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      await refreshProfile();
      setUploadMessage({ type: 'success', text: 'Photo de profil mise à jour avec succès !' });
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setUploadMessage({ type: 'error', text: err?.message || 'Erreur lors du téléversement de la photo de profil.' });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingBanner(true);
    setUploadMessage(null);
    try {
      const publicUrl = await uploadBanner(file, user.id);
      setBannerUrl(publicUrl);

      // If provider, update provider_profiles banner_url
      if (profile?.role === 'provider') {
        await supabase
          .from('provider_profiles')
          .update({ banner_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      setUploadMessage({ type: 'success', text: 'Photo de couverture mise à jour avec succès !' });
    } catch (err: any) {
      console.error('Error uploading banner:', err);
      setUploadMessage({ type: 'error', text: err?.message || 'Erreur lors du téléversement de la photo de couverture.' });
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleBannerFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {uploadMessage && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-xl p-4 text-sm font-medium ${
            uploadMessage.type === 'success'
              ? 'bg-success-50 text-success-800 border border-success-200'
              : 'bg-error-50 text-error-800 border border-error-200'
          }`}
        >
          {uploadMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{uploadMessage.text}</span>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">{t.user.profile}</h1>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="btn-secondary"
              >
                <X size={18} />
                {t.common.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? <span className="animate-spin">⏳</span> : <><Save size={18} /> {t.common.save}</>}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary"
            >
              <Edit2 size={18} />
              {t.common.edit}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="card overflow-hidden">
            {/* Banner with upload button */}
            <div className="relative h-32 bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden group">
              {bannerUrl && (
                <img src={bannerUrl} alt="Cover" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="absolute right-2 top-2 rounded-lg bg-black/40 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/60 shadow-sm flex items-center gap-1.5 text-xs font-medium"
                title="Modifier la couverture"
              >
                {uploadingBanner ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <Camera size={15} />
                    <span className="hidden sm:inline">Couverture</span>
                  </>
                )}
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="-mt-12 mb-4 flex justify-center">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full border-4 border-white bg-neutral-200 flex items-center justify-center overflow-hidden shadow-md">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name || 'Avatar'} className="h-full w-full object-cover" />
                    ) : (
                      <User size={48} className="text-neutral-400" />
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white">
                        <Loader2 size={24} className="animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 rounded-full bg-primary-600 p-2 text-white shadow-md hover:bg-primary-700 transition-colors"
                    title="Changer la photo de profil"
                  >
                    {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  </button>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-neutral-900">{profile.full_name || t.common.notAvailable}</h2>
                <p className="text-sm text-neutral-600">{profile.email}</p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  <Shield size={12} />
                  {profile.role === 'admin' ? t.user.role.admin : profile.role === 'provider' ? t.user.role.provider : t.user.role.visitor}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 card">
            <h3 className="mb-4 font-semibold text-neutral-900">{t.user.quickActions}</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/favorites')}
                className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <span className="text-lg">⭐</span>
                {t.user.favorites}
              </button>
              <button
                onClick={() => navigate('/messages')}
                className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <span className="text-lg">💬</span>
                {t.user.messages}
              </button>
              {profile.role === 'provider' && (
                <button
                  onClick={() => navigate('/provider/dashboard')}
                  className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <span className="text-lg">📊</span>
                  {t.provider.dashboard}
                </button>
              )}
              {profile.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <span className="text-lg">🔧</span>
                  {t.user.adminPanel}
                </button>
              )}
              <hr className="my-2 border-neutral-200" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-error-600 hover:bg-error-50"
              >
                <LogOut size={16} />
                {t.nav.logout}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <h3 className="mb-4 font-semibold text-neutral-900">{t.user.personalInformation}</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">{t.auth.fullName}</p>
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
                  <p className="text-sm text-neutral-500">{t.auth.email}</p>
                  <p className="text-sm font-medium text-neutral-900">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">{t.provider.fields.phone}</p>
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
                  <p className="text-sm text-neutral-500">{t.provider.fields.country}</p>
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
                      {selectedCountry?.name || t.common.notAvailable}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">{t.user.preferredCurrency}</p>
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
                      {selectedCurrency ? `${selectedCurrency.symbol} ${selectedCurrency.name}` : t.common.notAvailable}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">{t.user.language}</p>
                  {editing ? (
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {supportedLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-neutral-900">
                      {supportedLanguages.find((lang) => lang.code === formData.language)?.name || supportedLanguages[0].name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">{t.user.memberSince}</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatDate(profile.created_at, locale)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield size={20} className="mt-0.5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">{t.user.accountStatusLabel}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    profile.status === 'active' 
                      ? 'bg-success-50 text-success-700' 
                      : profile.status === 'suspended'
                      ? 'bg-warning-50 text-warning-700'
                      : 'bg-error-50 text-error-700'
                  }`}>
                    {profile.status === 'active' ? t.user.accountStatus.active : profile.status === 'suspended' ? t.user.accountStatus.suspended : t.user.accountStatus.banned}
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
