import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Edit, 
  Check, 
  X, 
  RefreshCw,
  Filter,
  Star,
  MapPin,
  Shield,
  Building2,
  Calendar,
  Eye,
  Trash2,
  Clock
} from 'lucide-react';

interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string;
  headline: string;
  city: string;
  country: string;
  validation_status: 'pending' | 'approved' | 'rejected';
  is_certified: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  category?: {
    name: string;
  };
}

export default function ProviderManagement() {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .select('*, category:categories(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = 
      provider.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || provider.validation_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleValidationStatus = async (providerId: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('provider_profiles')
        .update({ 
          validation_status: status,
          validated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) throw error;
      await loadProviders();
    } catch (error) {
      console.error('Error updating validation status:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prestataire ?')) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('provider_profiles')
        .delete()
        .eq('id', providerId);

      if (error) throw error;
      await loadProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Prestataires</h2>
          <p className="text-gray-600">Validez et gérez tous les prestataires de la plateforme</p>
        </div>
        <button
          onClick={loadProviders}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold">{providers.length}</div>
          <div className="text-sm text-gray-600">Prestataires</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-xs text-gray-500">Validés</span>
          </div>
          <div className="text-2xl font-bold">{providers.filter(p => p.validation_status === 'approved').length}</div>
          <div className="text-sm text-gray-600">Validés</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-xs text-gray-500">En attente</span>
          </div>
          <div className="text-2xl font-bold">{providers.filter(p => p.validation_status === 'pending').length}</div>
          <div className="text-sm text-gray-600">En attente</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Star className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-gray-500">Certifiés</span>
          </div>
          <div className="text-2xl font-bold">{providers.filter(p => p.is_certified).length}</div>
          <div className="text-sm text-gray-600">Certifiés</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Validés</option>
            <option value="rejected">Rejetés</option>
          </select>
        </div>
      </div>

      {/* Providers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prestataire</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localisation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProviders.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{provider.business_name}</div>
                    <div className="text-sm text-gray-500">{provider.headline}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {provider.city}, {provider.country}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {provider.category?.name || 'Non spécifié'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(provider.validation_status)}`}>
                      {provider.validation_status === 'approved' ? 'Validé' : 
                       provider.validation_status === 'rejected' ? 'Rejeté' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {provider.rating_count > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill" />
                        {provider.rating_avg.toFixed(1)} ({provider.rating_count})
                      </div>
                    ) : (
                      <span className="text-gray-400">Aucun avis</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(provider.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedProvider(provider);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {provider.validation_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleValidationStatus(provider.id, 'approved')}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleValidationStatus(provider.id, 'rejected')}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteProvider(provider.id)}
                        disabled={actionLoading}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Détails du prestataire</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedProvider.business_name}</h4>
                <p className="text-sm text-gray-600">{selectedProvider.headline}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Statut validation</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedProvider.validation_status)}`}>
                    {selectedProvider.validation_status === 'approved' ? 'Validé' : 
                     selectedProvider.validation_status === 'rejected' ? 'Rejeté' : 'En attente'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Certifié</p>
                  <p className="text-sm font-medium">{selectedProvider.is_certified ? 'Oui' : 'Non'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Localisation</p>
                <p className="text-sm font-medium">{selectedProvider.city}, {selectedProvider.country}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Note</p>
                <p className="text-sm font-medium">
                  {selectedProvider.rating_count > 0 
                    ? `${selectedProvider.rating_avg.toFixed(1)}/5 (${selectedProvider.rating_count} avis)`
                    : 'Aucun avis'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Fermer
              </button>
              {selectedProvider.validation_status === 'pending' && (
                <button
                  onClick={() => {
                    handleValidationStatus(selectedProvider.id, 'approved');
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Valider
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}