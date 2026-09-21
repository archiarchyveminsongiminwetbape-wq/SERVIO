import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CreditCard, Plus, Trash2, CheckCircle, AlertCircle, Smartphone, Building2 } from 'lucide-react';

interface BankAccount {
  id: string;
  account_type: string;
  provider: string;
  account_number: string;
  account_name: string;
  bank_code?: string;
  currency: string;
  country_code: string;
  is_primary: boolean;
  is_verified: boolean;
}

export default function ProviderBankAccountSetup({ providerId }: { providerId: string }) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    account_type: 'mobile_money',
    provider: 'orange_money',
    account_number: '',
    account_name: '',
    bank_code: '',
    currency: 'XAF',
    country_code: 'CM'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBankAccounts();
  }, [providerId]);

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('provider_bank_accounts')
        .select('*')
        .eq('provider_id', providerId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      setError('Erreur lors du chargement des comptes bancaires');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const { data, error } = await supabase
        .from('provider_bank_accounts')
        .insert({
          provider_id: providerId,
          account_type: formData.account_type,
          provider: formData.provider,
          account_number: formData.account_number,
          account_name: formData.account_name,
          bank_code: formData.account_type === 'bank_account' ? formData.bank_code : null,
          currency: formData.currency,
          country_code: formData.country_code,
          is_primary: bankAccounts.length === 0, // Premier compte devient principal
          is_verified: false // Doit être vérifié par admin
        })
        .select()
        .single();

      if (error) throw error;

      setSuccess('Compte bancaire ajouté avec succès!');
      setShowForm(false);
      setFormData({
        account_type: 'mobile_money',
        provider: 'orange_money',
        account_number: '',
        account_name: '',
        bank_code: '',
        currency: 'XAF',
        country_code: 'CM'
      });

      await loadBankAccounts();
    } catch (error) {
      console.error('Error adding bank account:', error);
      setError('Erreur lors de l\'ajout du compte bancaire');
    } finally {
      setSubmitting(false);
    }
  };

  const setAsPrimary = async (accountId: string) => {
    try {
      // Désactiver tous les comptes principaux
      await supabase
        .from('provider_bank_accounts')
        .update({ is_primary: false })
        .eq('provider_id', providerId);

      // Activer le compte sélectionné
      const { error } = await supabase
        .from('provider_bank_accounts')
        .update({ is_primary: true })
        .eq('id', accountId);

      if (error) throw error;

      await loadBankAccounts();
      setSuccess('Compte principal mis à jour!');
    } catch (error) {
      console.error('Error setting primary account:', error);
      setError('Erreur lors de la mise à jour du compte principal');
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte?')) return;

    try {
      const { error } = await supabase
        .from('provider_bank_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      await loadBankAccounts();
      setSuccess('Compte supprimé avec succès!');
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Erreur lors de la suppression du compte');
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'orange_money':
        return <Smartphone className="w-5 h-5 text-orange-500" />;
      case 'mtn_money':
        return <Smartphone className="w-5 h-5 text-yellow-500" />;
      case 'wave':
        return <Smartphone className="w-5 h-5 text-blue-500" />;
      default:
        return <Building2 className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Comptes Bancaires</h2>
          <p className="text-gray-600">Configurez vos comptes pour recevoir les paiements</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Ajouter un compte
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Ajouter un compte bancaire</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type de compte</label>
              <select
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_account">Compte bancaire</option>
              </select>
            </div>

            {formData.account_type === 'mobile_money' && (
              <div>
                <label className="block text-sm font-medium mb-2">Fournisseur</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="orange_money">Orange Money</option>
                  <option value="mtn_money">MTN Money</option>
                  <option value="wave">Wave</option>
                </select>
              </div>
            )}

            {formData.account_type === 'bank_account' && (
              <div>
                <label className="block text-sm font-medium mb-2">Code bancaire</label>
                <input
                  type="text"
                  value={formData.bank_code}
                  onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Ex: CMCIC, BICEC, etc."
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Numéro de compte</label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="Numéro de compte ou téléphone"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nom du titulaire</label>
              <input
                type="text"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="Nom complet sur le compte"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Devise</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="XAF">XAF (Franc CFA)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pays</label>
                <select
                  value={formData.country_code}
                  onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="CM">Cameroun</option>
                  <option value="SN">Sénégal</option>
                  <option value="CI">Côte d'Ivoire</option>
                  <option value="ML">Mali</option>
                  <option value="BF">Burkina Faso</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Ajout en cours...' : 'Ajouter le compte'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {bankAccounts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Aucun compte bancaire configuré</p>
            <p className="text-sm text-gray-500">Ajoutez un compte pour recevoir vos paiements</p>
          </div>
        ) : (
          bankAccounts.map((account) => (
            <div key={account.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  {getProviderIcon(account.provider)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">
                        {account.provider.replace('_', ' ').toUpperCase()}
                      </h4>
                      {account.is_primary && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Principal
                        </span>
                      )}
                      {account.is_verified && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Vérifié
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {account.account_number} - {account.account_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {account.currency} - {account.country_code}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!account.is_primary && (
                    <button
                      onClick={() => setAsPrimary(account.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Définir principal
                    </button>
                  )}
                  <button
                    onClick={() => deleteAccount(account.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Les comptes doivent être vérifiés par l'administration avant de pouvoir recevoir des paiements.
          La vérification peut prendre 24-48h.
        </p>
      </div>
    </div>
  );
}
