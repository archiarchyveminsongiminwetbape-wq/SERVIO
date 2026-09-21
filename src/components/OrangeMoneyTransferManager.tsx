import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { orangeMoneyTransferService } from '@/lib/orange-money-transfer';
import { 
  Smartphone, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  User,
  Building,
  Calendar,
  CreditCard,
  Settings,
  X
} from 'lucide-react';

interface Transfer {
  id: string;
  escrow_id?: string;
  milestone_id?: string;
  provider_id?: string;
  amount: number;
  currency: string;
  transfer_id?: string;
  reference: string;
  status: string;
  initiated_by?: string;
  beneficiary_name: string;
  beneficiary_account: string;
  bank_code: string;
  provider_response?: any;
  error_message?: string;
  processed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  milestone_title?: string;
  milestone_percentage?: number;
  provider_business?: string;
  admin_name?: string;
  escrow_remaining?: number;
}

interface TransferStats {
  totalTransfers: number;
  completedTransfers: number;
  failedTransfers: number;
  processingTransfers: number;
  totalAmount: number;
  completedAmount: number;
  avgTransferAmount: number;
}

export default function OrangeMoneyTransferManager() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [stats, setStats] = useState<TransferStats>({
    totalTransfers: 0,
    completedTransfers: 0,
    failedTransfers: 0,
    processingTransfers: 0,
    totalAmount: 0,
    completedAmount: 0,
    avgTransferAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUser(user);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      alert('Accès non autorisé. Réservé aux administrateurs.');
      return;
    }

    await loadAllData();
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTransfers(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransfers = async () => {
    const { data, error } = await supabase
      .from('recent_transfers_view')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setTransfers(data || []);
  };

  const loadStats = async () => {
    const { data, error } = await supabase.rpc('get_transfer_stats');

    if (error) throw error;
    if (data && data.length > 0) {
      setStats(data[0]);
    }
  };

  const checkTransferStatus = async (transferId: string, flutterwaveTransferId?: string) => {
    if (!flutterwaveTransferId) {
      alert('ID de transfert Flutterwave manquant');
      return;
    }

    setActionLoading(true);
    try {
      const result = await orangeMoneyTransferService.getTransferStatus(flutterwaveTransferId);

      if (result.success) {
        // Mettre à jour le statut dans la base de données
        const newStatus = result.data?.status === 'successful' ? 'completed' : 
                         result.data?.status === 'failed' ? 'failed' : 'processing';

        const { error } = await supabase
          .from('transfers')
          .update({
            status: newStatus,
            provider_response: result.data,
            processed_at: newStatus === 'completed' ? new Date().toISOString() : null,
            error_message: result.data?.message || null,
          })
          .eq('id', transferId);

        if (!error) {
          await loadAllData();
          alert('Statut du transfert mis à jour!');
        } else {
          throw error;
        }
      } else {
        alert('Erreur lors de la vérification: ' + result.error);
      }
    } catch (error) {
      console.error('Error checking transfer status:', error);
      alert('Erreur lors de la vérification du statut');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelTransfer = async (transferId: string, flutterwaveTransferId?: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce transfert?')) return;
    if (!flutterwaveTransferId) {
      alert('ID de transfert Flutterwave manquant');
      return;
    }

    setActionLoading(true);
    try {
      const result = await orangeMoneyTransferService.cancelTransfer(flutterwaveTransferId);

      if (result.success) {
        const { error } = await supabase
          .from('transfers')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', transferId);

        if (!error) {
          await loadAllData();
          alert('Transfert annulé avec succès!');
        } else {
          throw error;
        }
      } else {
        alert('Erreur lors de l\'annulation: ' + result.error);
      }
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      alert('Erreur lors de l\'annulation du transfert');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTransfers = transfers.filter(t => {
    const matchesSearch = 
      t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.beneficiary_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.beneficiary_account?.includes(searchTerm) ||
      t.provider_business?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'failed':
        return 'Échoué';
      case 'processing':
        return 'En cours';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Chargement des transferts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Transferts Orange Money</h2>
          <p className="text-gray-600">Suivez et gérez les transferts automatiques vers les prestataires</p>
        </div>
        
        <button
          onClick={loadAllData}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalTransfers}</div>
          <div className="text-sm text-gray-600 mt-1">Transferts</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">En cours</span>
          </div>
          <div className="text-2xl font-bold">{stats.processingTransfers}</div>
          <div className="text-sm text-gray-600 mt-1">Traitement</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">Complétés</span>
          </div>
          <div className="text-2xl font-bold">{stats.completedTransfers}</div>
          <div className="text-sm text-gray-600 mt-1">{stats.completedAmount.toLocaleString()} XAF</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <XCircle className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">Échoués</span>
          </div>
          <div className="text-2xl font-bold">{stats.failedTransfers}</div>
          <div className="text-sm text-gray-600 mt-1">Erreurs</div>
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
                placeholder="Rechercher par référence, bénéficiaire ou prestataire..."
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
            <option value="processing">En cours</option>
            <option value="completed">Complétés</option>
            <option value="failed">Échoués</option>
            <option value="cancelled">Annulés</option>
          </select>
        </div>
      </div>

      {/* Transfers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bénéficiaire</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transfer.reference}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transfer.beneficiary_name}</div>
                    <div className="text-sm text-gray-500">{transfer.beneficiary_account}</div>
                    {transfer.provider_business && (
                      <div className="text-xs text-gray-400">{transfer.provider_business}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-semibold">{transfer.amount.toLocaleString()} {transfer.currency}</div>
                    {transfer.milestone_percentage && (
                      <div className="text-xs text-gray-500">{transfer.milestone_percentage}% du milestone</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transfer.status)}`}>
                      {getStatusIcon(transfer.status)}
                      <span className="ml-1">{getStatusText(transfer.status)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transfer.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedTransfer(transfer);
                          setShowDetailModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-900 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {transfer.status === 'processing' && (
                        <>
                          <button
                            onClick={() => checkTransferStatus(transfer.id, transfer.transfer_id)}
                            disabled={actionLoading}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => cancelTransfer(transfer.id, transfer.transfer_id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransfers.length === 0 && (
          <div className="text-center py-12">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Aucun transfert trouvé</p>
            <p className="text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Aucun transfert effectué'}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Détails du transfert</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${getStatusColor(selectedTransfer.status)}`}>
                  {getStatusIcon(selectedTransfer.status)}
                </div>
                <div>
                  <h4 className="text-lg font-semibold">{selectedTransfer.reference}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTransfer.status)}`}>
                    {getStatusText(selectedTransfer.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-semibold text-lg">{selectedTransfer.amount.toLocaleString()} {selectedTransfer.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date création</p>
                  <p className="font-semibold">{new Date(selectedTransfer.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bénéficiaire</p>
                  <p className="font-semibold">{selectedTransfer.beneficiary_name}</p>
                  <p className="text-sm text-gray-500">{selectedTransfer.beneficiary_account}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Code bancaire</p>
                  <p className="font-semibold">{selectedTransfer.bank_code}</p>
                </div>
                {selectedTransfer.processed_at && (
                  <div>
                    <p className="text-sm text-gray-600">Traité le</p>
                    <p className="font-semibold">{new Date(selectedTransfer.processed_at).toLocaleString('fr-FR')}</p>
                  </div>
                )}
                {selectedTransfer.cancelled_at && (
                  <div>
                    <p className="text-sm text-gray-600">Annulé le</p>
                    <p className="font-semibold">{new Date(selectedTransfer.cancelled_at).toLocaleString('fr-FR')}</p>
                  </div>
                )}
              </div>

              {selectedTransfer.milestone_title && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Détails du milestone</p>
                  <div className="text-sm">
                    <p><span className="text-gray-600">Titre:</span> {selectedTransfer.milestone_title}</p>
                    {selectedTransfer.milestone_percentage && (
                      <p><span className="text-gray-600">Pourcentage:</span> {selectedTransfer.milestone_percentage}%</p>
                    )}
                  </div>
                </div>
              )}

              {selectedTransfer.provider_business && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Prestataire</p>
                  <p className="text-sm">{selectedTransfer.provider_business}</p>
                </div>
              )}

              {selectedTransfer.admin_name && (
                <div>
                  <p className="text-sm text-gray-600">Initié par</p>
                  <p className="font-semibold">{selectedTransfer.admin_name}</p>
                </div>
              )}

              {selectedTransfer.provider_response && (
                <div>
                  <p className="text-sm font-medium mb-2">Réponse du fournisseur</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedTransfer.provider_response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedTransfer.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800">Message d'erreur</p>
                  <p className="text-sm text-red-700">{selectedTransfer.error_message}</p>
                </div>
              )}

              {selectedTransfer.status === 'processing' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => checkTransferStatus(selectedTransfer.id, selectedTransfer.transfer_id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {actionLoading ? 'Vérification...' : 'Vérifier statut'}
                  </button>
                  <button
                    onClick={() => cancelTransfer(selectedTransfer.id, selectedTransfer.transfer_id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {actionLoading ? 'Annulation...' : 'Annuler'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}