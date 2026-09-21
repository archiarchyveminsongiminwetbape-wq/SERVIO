import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Download,
  RefreshCw,
  Shield,
  Zap,
  BarChart3
} from 'lucide-react';

interface OrangeMoneyTransaction {
  id: string;
  tx_ref: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  booking_id?: string;
  user_id?: string;
  admin_notes?: string;
  evidence_urls?: string[];
  created_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
}

interface EscrowAccount {
  id: string;
  booking_id: string;
  total_amount: number;
  currency: string;
  status: string;
  release_percentage: number;
  amount_released: number;
  amount_remaining: number;
  funded_at: string;
  bookings?: {
    id: string;
    client_id: string;
    provider_id: string;
    service_type: string;
    status: string;
    profiles?: {
      full_name: string;
      email: string;
    };
    provider_profiles?: {
      business_name: string;
      user_id: string;
    };
  };
}

interface OrangeMoneyStats {
  totalTransactions: number;
  totalVolume: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  escrowTotal: number;
  escrowReleased: number;
  escrowRemaining: number;
  avgTransactionAmount: number;
}

export default function OrangeMoneyDashboard() {
  const [transactions, setTransactions] = useState<OrangeMoneyTransaction[]>([]);
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);
  const [stats, setStats] = useState<OrangeMoneyStats>({
    totalTransactions: 0,
    totalVolume: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    escrowTotal: 0,
    escrowReleased: 0,
    escrowRemaining: 0,
    avgTransactionAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<OrangeMoneyTransaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
        loadTransactions(),
        loadEscrowAccounts(),
        calculateStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('manual_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setTransactions(data || []);
  };

  const loadEscrowAccounts = async () => {
    const { data, error } = await supabase
      .from('escrow_accounts')
      .select(`
        *,
        bookings (
          id,
          client_id,
          provider_id,
          service_type,
          status,
          profiles (
            full_name,
            email
          ),
          provider_profiles (
            business_name,
            user_id
          )
        )
      `)
      .in('status', ['funded', 'partially_released'])
      .order('funded_at', { ascending: false });

    if (error) throw error;
    setEscrowAccounts(data || []);
  };

  const calculateStats = () => {
    const orangeMoneyTransactions = transactions.filter(
      t => t.payment_method === 'orange_money' || t.payment_method === 'manual'
    );

    const totalVolume = orangeMoneyTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = orangeMoneyTransactions.length > 0 
      ? totalVolume / orangeMoneyTransactions.length 
      : 0;

    const escrowTotal = escrowAccounts.reduce((sum, acc) => sum + acc.total_amount, 0);
    const escrowReleased = escrowAccounts.reduce((sum, acc) => sum + acc.amount_released, 0);
    const escrowRemaining = escrowAccounts.reduce((sum, acc) => sum + acc.amount_remaining, 0);

    setStats({
      totalTransactions: orangeMoneyTransactions.length,
      totalVolume,
      pendingTransactions: orangeMoneyTransactions.filter(t => t.status === 'pending').length,
      completedTransactions: orangeMoneyTransactions.filter(t => t.status === 'confirmed').length,
      failedTransactions: orangeMoneyTransactions.filter(t => t.status === 'rejected').length,
      escrowTotal,
      escrowReleased,
      escrowRemaining,
      avgTransactionAmount: avgAmount,
    });
  };

  const confirmTransaction = async (transactionId: string) => {
    if (!currentUser) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('manual_payments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: currentUser.id,
        })
        .eq('id', transactionId);

      if (!error) {
        await loadAllData();
        setShowDetailModal(false);
        alert('Transaction confirmée avec succès!');
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error confirming transaction:', error);
      alert('Erreur lors de la confirmation');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectTransaction = async (transactionId: string, reason: string) => {
    if (!currentUser) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('manual_payments')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: currentUser.id,
          rejection_reason: reason,
        })
        .eq('id', transactionId);

      if (!error) {
        await loadAllData();
        setShowDetailModal(false);
        alert('Transaction rejetée');
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      alert('Erreur lors du rejet');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tx_ref?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Chargement du dashboard Orange Money...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500 text-white">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Dashboard Orange Money</h1>
            <p className="text-gray-600">Gestion des paiements Orange Money et Escrow</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
          { id: 'transactions', label: 'Transactions', icon: CreditCard },
          { id: 'escrow', label: 'Comptes Escrow', icon: Shield },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === tab.id 
                  ? 'border-orange-500 text-orange-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-500">Total volume</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalVolume.toLocaleString()} XAF</div>
              <div className="text-sm text-gray-600 mt-1">{stats.totalTransactions} transactions</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-500">En attente</span>
              </div>
              <div className="text-2xl font-bold">{stats.pendingTransactions}</div>
              <div className="text-sm text-gray-600 mt-1">Transactions à valider</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-500">En Escrow</span>
              </div>
              <div className="text-2xl font-bold">{stats.escrowTotal.toLocaleString()} XAF</div>
              <div className="text-sm text-gray-600 mt-1">{stats.escrowRemaining.toLocaleString()} XAF restant</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-500">Moyenne</span>
              </div>
              <div className="text-2xl font-bold">{Math.round(stats.avgTransactionAmount).toLocaleString()} XAF</div>
              <div className="text-sm text-gray-600 mt-1">Par transaction</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Activité récente</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                    </div>
                    <div>
                      <div className="font-medium">{transaction.customer_name}</div>
                      <div className="text-sm text-gray-600">{transaction.tx_ref}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{transaction.amount.toLocaleString()} XAF</div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {selectedTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email ou référence..."
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
                <option value="confirmed">Confirmés</option>
                <option value="rejected">Rejetés</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.tx_ref}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{transaction.customer_name}</div>
                        <div className="text-sm text-gray-500">{transaction.customer_email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.amount.toLocaleString()} {transaction.currency}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowDetailModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-900 font-medium"
                        >
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Escrow Tab */}
      {selectedTab === 'escrow' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-2">Total en Escrow</div>
              <div className="text-2xl font-bold">{stats.escrowTotal.toLocaleString()} XAF</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-2">Fonds Libérés</div>
              <div className="text-2xl font-bold text-green-600">{stats.escrowReleased.toLocaleString()} XAF</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-2">Fonds Restants</div>
              <div className="text-2xl font-bold text-orange-600">{stats.escrowRemaining.toLocaleString()} XAF</div>
            </div>
          </div>

          <div className="space-y-4">
            {escrowAccounts.map((escrow) => (
              <div key={escrow.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-lg font-semibold">
                      {escrow.bookings?.service_type || 'Service'}
                    </div>
                    <p className="text-sm text-gray-600">
                      Client: {escrow.bookings?.profiles?.full_name} | 
                      Prestataire: {escrow.bookings?.provider_profiles?.business_name}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    escrow.status === 'funded' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {escrow.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-semibold">{escrow.total_amount.toLocaleString()} {escrow.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Libéré</p>
                    <p className="font-semibold text-green-600">{escrow.amount_released.toLocaleString()} {escrow.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Restant</p>
                    <p className="font-semibold text-orange-600">{escrow.amount_remaining.toLocaleString()} {escrow.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Progression</p>
                    <p className="font-semibold">{escrow.release_percentage}%</p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full transition-all" 
                    style={{ width: `${escrow.release_percentage}%` }}
                  />
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Financé le: {new Date(escrow.funded_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Statistiques détaillées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Transactions par statut</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confirmées</span>
                    <span className="font-semibold text-green-600">{stats.completedTransactions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">En attente</span>
                    <span className="font-semibold text-yellow-600">{stats.pendingTransactions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rejetées</span>
                    <span className="font-semibold text-red-600">{stats.failedTransactions}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Volumes financiers</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Volume total</span>
                    <span className="font-semibold">{stats.totalVolume.toLocaleString()} XAF</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">En escrow</span>
                    <span className="font-semibold">{stats.escrowTotal.toLocaleString()} XAF</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Moyenne/transaction</span>
                    <span className="font-semibold">{Math.round(stats.avgTransactionAmount).toLocaleString()} XAF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Détails de la transaction</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Référence</p>
                  <p className="font-semibold">{selectedTransaction.tx_ref}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-semibold text-lg">{selectedTransaction.amount.toLocaleString()} {selectedTransaction.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Méthode</p>
                  <p className="font-semibold">{selectedTransaction.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-semibold">{selectedTransaction.customer_name}</p>
                  <p className="text-sm text-gray-500">{selectedTransaction.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-semibold">{selectedTransaction.customer_phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date création</p>
                  <p className="font-semibold">{new Date(selectedTransaction.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date confirmation</p>
                  <p className="font-semibold">
                    {selectedTransaction.confirmed_at 
                      ? new Date(selectedTransaction.confirmed_at).toLocaleString('fr-FR') 
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedTransaction.evidence_urls && selectedTransaction.evidence_urls.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Preuves de paiement</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTransaction.evidence_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Preuve {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedTransaction.admin_notes && (
                <div>
                  <p className="text-sm font-medium mb-2">Notes admin</p>
                  <p className="text-sm text-gray-600">{selectedTransaction.admin_notes}</p>
                </div>
              )}

              {selectedTransaction.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800">Raison du rejet</p>
                  <p className="text-sm text-red-700">{selectedTransaction.rejection_reason}</p>
                </div>
              )}

              {selectedTransaction.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => confirmTransaction(selectedTransaction.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading ? 'Confirmation...' : 'Confirmer'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Raison du rejet:');
                      if (reason) rejectTransaction(selectedTransaction.id, reason);
                    }}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {actionLoading ? 'Rejet...' : 'Rejeter'}
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