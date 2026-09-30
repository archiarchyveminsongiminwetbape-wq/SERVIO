import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  RefreshCw,
  Filter,
  DollarSign,
  Lock,
  Unlock,
  Check,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  Download,
  Eye
} from 'lucide-react';

interface EscrowAccount {
  id: string;
  booking_id: string;
  total_amount: number;
  held_amount: number;
  released_amount: number;
  status: 'active' | 'released' | 'partially_released' | 'disputed';
  created_at: string;
  released_at?: string;
  booking?: {
    id: string;
    client_id: string;
    provider_id: string;
    service_type: string;
    scheduled_at: string;
  };
}

export default function EscrowManagement() {
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowAccount | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadEscrowAccounts();
  }, []);

  const loadEscrowAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('escrow_accounts')
        .select('*, booking:bookings(id, client_id, provider_id, service_type, scheduled_at)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEscrowAccounts(data || []);
    } catch (error) {
      console.error('Error loading escrow accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEscrowAccounts = escrowAccounts.filter(account => {
    const matchesSearch = 
      account.booking?.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleReleaseFunds = async (escrowId: string, amount: number) => {
    if (!confirm(`Êtes-vous sûr de vouloir libérer ${amount.toLocaleString()} XAF ?`)) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('escrow_accounts')
        .update({ 
          released_amount: amount,
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('id', escrowId);

      if (error) throw error;
      await loadEscrowAccounts();
    } catch (error) {
      console.error('Error releasing funds:', error);
      alert('Erreur lors de la libération des fonds');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async (escrowId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir marquer ce compte comme disputé ?')) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('escrow_accounts')
        .update({ status: 'disputed' })
        .eq('id', escrowId);

      if (error) throw error;
      await loadEscrowAccounts();
    } catch (error) {
      console.error('Error disputing escrow:', error);
      alert('Erreur lors de la mise en litige');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'partially_released':
        return 'bg-yellow-100 text-yellow-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
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
          <h2 className="text-2xl font-bold">Gestion Escrow</h2>
          <p className="text-gray-600">Gérez les comptes escrow et la libération des fonds</p>
        </div>
        <button
          onClick={loadEscrowAccounts}
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
            <Lock className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold">{escrowAccounts.length}</div>
          <div className="text-sm text-gray-600">Comptes</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-gray-500">Retenu</span>
          </div>
          <div className="text-2xl font-bold">
            {escrowAccounts
              .filter(e => e.status === 'active')
              .reduce((sum, e) => sum + e.held_amount, 0)
              .toLocaleString()} XAF
          </div>
          <div className="text-sm text-gray-600">Fonds bloqués</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Unlock className="w-5 h-5 text-green-600" />
            <span className="text-xs text-gray-500">Libéré</span>
          </div>
          <div className="text-2xl font-bold">
            {escrowAccounts
              .filter(e => e.status === 'released')
              .reduce((sum, e) => sum + e.released_amount, 0)
              .toLocaleString()} XAF
          </div>
          <div className="text-sm text-gray-600">Fonds libérés</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-xs text-gray-500">Litiges</span>
          </div>
          <div className="text-2xl font-bold">{escrowAccounts.filter(e => e.status === 'disputed').length}</div>
          <div className="text-sm text-gray-600">En litige</div>
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
                placeholder="Rechercher par ID ou service..."
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
            <option value="active">Actifs</option>
            <option value="released">Libérés</option>
            <option value="partially_released">Partiellement libérés</option>
            <option value="disputed">En litige</option>
          </select>
        </div>
      </div>

      {/* Escrow Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retenu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libéré</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date création</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEscrowAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    #{account.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {account.booking?.service_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.total_amount.toLocaleString()} XAF
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {account.held_amount.toLocaleString()} XAF
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {account.released_amount.toLocaleString()} XAF
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(account.status)}`}>
                      {account.status === 'active' ? 'Actif' : 
                       account.status === 'released' ? 'Libéré' :
                       account.status === 'partially_released' ? 'Partiellement libéré' : 'En litige'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(account.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedEscrow(account);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {account.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleReleaseFunds(account.id, account.held_amount)}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDispute(account.id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900"
                          >
                            <AlertTriangle className="w-4 h-4" />
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
      </div>

      {/* Detail Modal */}
      {showModal && selectedEscrow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Détails du compte escrow</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Montant total</p>
                  <p className="text-sm font-medium">{selectedEscrow.total_amount.toLocaleString()} XAF</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant retenu</p>
                  <p className="text-sm font-medium">{selectedEscrow.held_amount.toLocaleString()} XAF</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Montant libéré</p>
                  <p className="text-sm font-medium">{selectedEscrow.released_amount.toLocaleString()} XAF</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedEscrow.status)}`}>
                    {selectedEscrow.status === 'active' ? 'Actif' : 
                     selectedEscrow.status === 'released' ? 'Libéré' :
                     selectedEscrow.status === 'partially_released' ? 'Partiellement libéré' : 'En litige'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date création</p>
                  <p className="text-sm font-medium">{new Date(selectedEscrow.created_at).toLocaleString('fr-FR')}</p>
                </div>
                {selectedEscrow.released_at && (
                  <div>
                    <p className="text-sm text-gray-600">Date libération</p>
                    <p className="text-sm font-medium">{new Date(selectedEscrow.released_at).toLocaleString('fr-FR')}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Fermer
              </button>
              {selectedEscrow.status === 'active' && (
                <button
                  onClick={() => {
                    handleReleaseFunds(selectedEscrow.id, selectedEscrow.held_amount);
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Libérer les fonds
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}