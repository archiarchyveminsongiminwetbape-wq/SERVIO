import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Bell, Shield, Eye, Globe, Trash2, Save, 
  Lock, Mail, Phone, MapPin, CreditCard, AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { supabase } from '@/lib/supabase';
import type { Language } from '@/i18n/translations';

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const { setLanguage } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    emailMessages: true,
    emailReviews: true,
    emailUpdates: false,
    language: 'fr',
    currency: 'EUR',
    timezone: 'Europe/Paris',
  });

  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    loadSettings();
  }, [user]);

  async function loadSettings() {
    if (!user) return;

    setLoading(true);
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setSettings({
          emailNotifications: data.email_notifications ?? true,
          pushNotifications: data.push_notifications ?? false,
          emailMessages: data.email_messages ?? true,
          emailReviews: data.email_reviews ?? true,
          emailUpdates: data.email_updates ?? false,
          language: data.language ?? 'fr',
          currency: data.currency ?? 'EUR',
          timezone: data.timezone ?? 'Europe/Paris',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings if table doesn't exist yet
    }
    setLoading(false);
  }

  const handleSaveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_notifications: settings.emailNotifications,
          push_notifications: settings.pushNotifications,
          email_messages: settings.emailMessages,
          email_reviews: settings.emailReviews,
          email_updates: settings.emailUpdates,
          language: settings.language,
          currency: settings.currency,
          timezone: settings.timezone,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving settings:', error);
        alert('Erreur lors de la sauvegarde des paramètres: ' + error.message);
      } else {
        setLanguage(settings.language as Language);
        alert('Paramètres sauvegardés avec succès');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de la sauvegarde des paramètres');
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== 'SUPPRIMER') return;

    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        console.error('Error deleting account:', error);
        alert('Erreur lors de la suppression du compte');
      } else {
        await signOut();
        navigate('/');
      }
    }
  };

  const tabs = [
    { id: 'account', label: 'Compte', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Confidentialité', icon: Shield },
    { id: 'preferences', label: 'Préférences', icon: Globe },
  ];

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Paramètres</h1>
        <p className="mt-1 text-sm text-neutral-600">Gérez vos paramètres de compte et préférences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="hidden w-64 flex-shrink-0 lg:block">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 border-t border-neutral-200 pt-6">
            <button
              onClick={() => setDeleteAccountOpen(true)}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-error-600 hover:bg-error-50"
            >
              <Trash2 size={18} />
              Supprimer le compte
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Mobile tabs */}
          <div className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="mb-4 font-semibold text-neutral-900">Informations du compte</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-primary-600">
                        {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{profile.full_name || 'Utilisateur'}</p>
                      <p className="text-sm text-neutral-600">{profile.email}</p>
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
                    <Shield size={20} className="mt-0.5 text-neutral-400" />
                    <div className="flex-1">
                      <p className="text-sm text-neutral-500">Rôle</p>
                      <p className="text-sm font-medium text-neutral-900">
                        {profile.role === 'admin' ? 'Administrateur' : profile.role === 'provider' ? 'Prestataire' : 'Client'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="mt-0.5 text-neutral-400" />
                    <div className="flex-1">
                      <p className="text-sm text-neutral-500">Membre depuis</p>
                      <p className="text-sm font-medium text-neutral-900">
                        {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => navigate('/profile')}
                    className="btn-secondary flex-1"
                  >
                    Modifier le profil
                  </button>
                  <button
                    onClick={() => navigate('/reset-password')}
                    className="btn-secondary flex-1"
                  >
                    <Lock size={16} />
                    Changer le mot de passe
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="mb-4 font-semibold text-neutral-900">Préférences de notification</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Notifications par email</p>
                      <p className="text-sm text-neutral-600">Recevoir des notifications par email</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings.emailNotifications ? 'bg-primary-600' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Notifications push</p>
                      <p className="text-sm text-neutral-600">Recevoir des notifications push dans le navigateur</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, pushNotifications: !settings.pushNotifications })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings.pushNotifications ? 'bg-primary-600' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <hr className="border-neutral-200" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Messages</p>
                      <p className="text-sm text-neutral-600">Notifications pour les nouveaux messages</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, emailMessages: !settings.emailMessages })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings.emailMessages ? 'bg-primary-600' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.emailMessages ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Avis</p>
                      <p className="text-sm text-neutral-600">Notifications pour les nouveaux avis</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, emailReviews: !settings.emailReviews })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings.emailReviews ? 'bg-primary-600' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.emailReviews ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Mises à jour</p>
                      <p className="text-sm text-neutral-600">Nouvelles fonctionnalités et mises à jour</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, emailUpdates: !settings.emailUpdates })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings.emailUpdates ? 'bg-primary-600' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.emailUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? <span className="animate-spin">⏳</span> : <><Save size={18} /> Enregistrer</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="mb-4 font-semibold text-neutral-900">Confidentialité des données</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Eye size={20} className="mt-0.5 text-neutral-400" />
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">Visibilité du profil</p>
                      <p className="text-sm text-neutral-600">
                        Votre profil est visible par les autres utilisateurs de la plateforme
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield size={20} className="mt-0.5 text-neutral-400" />
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">Protection des données</p>
                      <p className="text-sm text-neutral-600">
                        Vos données sont protégées conformément au RGPD
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe size={20} className="mt-0.5 text-neutral-400" />
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">Partage de données</p>
                      <p className="text-sm text-neutral-600">
                        Nous ne partageons vos données personnelles avec des tiers
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button className="btn-secondary">
                    Télécharger mes données
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Settings */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="mb-4 font-semibold text-neutral-900">Préférences générales</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Langue</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="input-field"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Devise</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="input-field"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="XAF">XAF (FCFA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Fuseau horaire</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="input-field"
                    >
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Africa/Douala">Africa/Douala</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? <span className="animate-spin">⏳</span> : <><Save size={18} /> Enregistrer</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Account Modal */}
          {deleteAccountOpen && (
            <div className="card border-error-200 bg-error-50">
              <div className="flex items-start gap-3">
                <AlertCircle size={24} className="mt-0.5 text-error-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-error-900">Supprimer le compte</h3>
                  <p className="mt-2 text-sm text-error-700">
                    Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                  </p>
                  
                  <div className="mt-4">
                    <label className="label">Tapez "SUPPRIMER" pour confirmer</label>
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                      className="input-field"
                      placeholder="SUPPRIMER"
                    />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setDeleteAccountOpen(false)}
                      className="btn-secondary"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== 'SUPPRIMER'}
                      className="btn-error"
                    >
                      <Trash2 size={18} />
                      Supprimer définitivement
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
