import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  User,
  Smartphone,
  Building,
  TrendingUp,
  Shield,
  RefreshCw,
  X,
  Upload,
  FileImage,
  Trash2
} from 'lucide-react';

interface ManualPayment {
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
  bookings?: {
    id: string;
    service_type: string;
    status: string;
  };
}

interface PaymentStats {
  totalPayments: number;
  totalVolume: number;
  pendingPayments: number;
  confirmedPayments: number;
  rejectedPayments: number;
  orangeMoneyPayments: number;
  avgPaymentAmount: number;
}

export default function ManualPaymentManager({ isAdmin = false }: { isAdmin?: boolean }) {
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalPayments: 0,
    totalVolume: 0,
    pendingPayments: 0,
    confirmedPayments: 0,
    rejectedPayments: 0,
    orangeMoneyPayments: 0,
    avgPaymentAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<ManualPayment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUser(user);

    if (isAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        alert('Accès non autorisé. Réservé aux administrateurs.');
        return;
      }
    }

    await loadAllData();
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPayments(),
        calculateStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    let query = supabase
      .from('manual_payments')
      .select(`
        *,
        bookings (
          id,
          service_type,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', currentUser?.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    setPayments(data || []);
  };

  const calculateStats = () => {
    const totalPayments = payments.length;
    const totalVolume = payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const confirmedPayments = payments.filter(p => p.status === 'confirmed').length;
    const rejectedPayments = payments.filter(p => p.status === 'rejected').length;
    const orangeMoneyPayments = payments.filter(p => p.payment_method === 'orange_money').length;
    const avgPaymentAmount = totalPayments > 0 ? totalVolume / totalPayments : 0;

    setStats({
      totalPayments,
      totalVolume,
      pendingPayments,
      confirmedPayments,
      rejectedPayments,
      orangeMoneyPayments,
      avgPaymentAmount,
    });
  };

  const handleEvidenceUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setEvidenceFiles(prev => [...prev, ...newFiles]);
  };

  const removeEvidenceFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadEvidence = async (paymentId: string) => {
    try {
      const uploadedUrls: string[] = [];
      for (const file of evidenceFiles) {
        const fileName = `payment-${paymentId}-${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('payment-evidence')
          .upload(fileName, file);

        if (error) throw error;

        if (data?.path) {
          const { data: { publicUrl } } = supabase.storage
            .from('payment-evidence')
            .getPublicUrl(data.path);
          uploadedUrls.push(publicUrl);
        }
      }

      // Update payment with evidence URLs
      const { error } = await supabase
        .from('manual_payments')
        .update({
          evidence_urls: uploadedUrls,
          admin_notes: adminNotes || null,
        })
        .eq('id', paymentId);

      if (error) throw error;

      setShowUploadModal(false);
      setEvidenceFiles([]);
      setAdminNotes('');
      await loadAllData();
      alert('Preuves uploadées avec succès!');
    } catch (error) {
      console.error('Error uploading evidence:', error);
      alert('Erreur lors de l\'upload des preuves');
    }
  };

  const confirmPayment = async (paymentId: string) => {
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
        .eq('id', paymentId);

      if (!error) {
        await loadAllData();
        setShowDetailModal(false);
        alert('Paiement confirmé avec succès!');
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Erreur lors de la confirmation');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectPayment = async (paymentId: string, reason: string) => {
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
        .eq('id', paymentId);

      if (!error) {
        await loadAllData();
        setShowDetailModal(false);
        alert('Paiement rejeté');
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Erreur lors du rejet');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tx_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
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
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'orange_money':
        return <Smartphone className="w-4 h-4 text-orange-500" />;
      case 'mtn_money':
        return <Smartphone className="w-4 h-4 text-yellow-500" />;
      case 'wave':
        return <Smartphone className="w-4 h-4 text-blue-500" />;
      case 'bank_transfer':
        return <Building className="w-4 h-4 text-gray-500" />;
      case 'cash':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'check':
        return <CreditCard className="w-4 h-4 text-purple-500" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      orange_money: 'Orange Money',
      mtn_money: 'MTN Money',
      wave: 'Wave',
      bank_transfer: 'Virement bancaire',
      cash: 'Espèces',
      check: 'Chèque',
      manual: 'Manuel',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Chargement des paiements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Paiements Manuels</h2>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Validez et gérez les paiements manuels des utilisateurs' 
              : 'Suivez vos paiements manuels'}
          </p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Ajouter une preuve
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalPayments}</div>
          <div className="text-sm text-gray-600 mt-1">Paiements</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">En attente</span>
          </div>
          <div className="text-2xl font-bold">{stats.pendingPayments}</div>
          <div className="text-sm text-gray-600 mt-1">À valider</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">Confirmés</span>
          </div>
          <div className="text-2xl font-bold">{stats.confirmedPayments}</div>
          <div className="text-sm text-gray-600 mt-1">Validés</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">Orange Money</span>
          </div>
          <div className="text-2xl font-bold">{stats.orangeMoneyPayments}</div>
          <div className="text-sm text-gray-600 mt-1">Transactions</div>
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
                placeholder="Rechercher par nom, email, téléphone ou référence..."
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
            <option value="cancelled">Annulés</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Toutes les méthodes</option>
            <option value="orange_money">Orange Money</option>
            <option value="mtn_money">MTN Money</option>
            <option value="wave">Wave</option>
            <option value="bank_transfer">Virement bancaire</option>
            <option value="cash">Espèces</option>
            <option value="check">Chèque</option>
          </select>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Méthode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.tx_ref}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payment.customer_name}</div>
                    <div className="text-sm text-gray-500">{payment.customer_email}</div>
                    {payment.customer_phone && (
                      <div className="text-xs text-gray-400">{payment.customer_phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-semibold">{payment.amount.toLocaleString()} {payment.currency}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getMethodIcon(payment.payment_method)}
                      <span className="text-sm text-gray-700">{getMethodLabel(payment.payment_method)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1">{payment.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
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

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Aucun paiement trouvé</p>
            <p className="text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Aucun paiement enregistré'}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Détails du paiement</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Référence</p>
                  <p className="font-semibold">{selectedPayment.tx_ref}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusIcon(selectedPayment.status)}
                    <span className="ml-1">{selectedPayment.status}</span>
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-semibold text-lg">{selectedPayment.amount.toLocaleString()} {selectedPayment.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Méthode</p>
                  <div className="flex items-center gap-2">
                    {getMethodIcon(selectedPayment.payment_method)}
                    <span className="font-semibold">{getMethodLabel(selectedPayment.payment_method)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-semibold">{selectedPayment.customer_name}</p>
                  <p className="text-sm text-gray-500">{selectedPayment.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-semibold">{selectedPayment.customer_phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date création</p>
                  <p className="font-semibold">{new Date(selectedPayment.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date confirmation</p>
                  <p className="font-semibold">
                    {selectedPayment.confirmed_at 
                      ? new Date(selectedPayment.confirmed_at).toLocaleString('fr-FR')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedPayment.bookings && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Détails de la réservation</p>
                  <div className="text-sm">
                    <p><span className="text-gray-600">Service:</span> {selectedPayment.bookings.service_type}</p>
                    <p><span className="text-gray-600">Statut:</span> {selectedPayment.bookings.status}</p>
                  </div>
                </div>
              )}

              {selectedPayment.evidence_urls && selectedPayment.evidence_urls.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Preuves de paiement</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedPayment.evidence_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preuve ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Agrandir
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPayment.admin_notes && (
                <div>
                  <p className="text-sm font-medium mb-2">Notes admin</p>
                  <p className="text-sm text-gray-600">{selectedPayment.admin_notes}</p>
                </div>
              )}

              {selectedPayment.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800">Raison du rejet</p>
                  <p className="text-sm text-red-700">{selectedPayment.rejection_reason}</p>
                </div>
              )}

              {isAdmin && selectedPayment.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => confirmPayment(selectedPayment.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading ? 'Confirmation...' : 'Confirmer'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Raison du rejet:');
                      if (reason) rejectPayment(selectedPayment.id, reason);
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

      {/* Upload Evidence Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Ajouter des preuves de paiement</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sélectionner un paiement</label>
                <select
                  value={selectedPayment?.id || ''}
                  onChange={(e) => {
                    const payment = payments.find(p => p.id === e.target.value);
                    setSelectedPayment(payment || null);
                  }}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez un paiement...</option>
                  {payments.filter(p => p.status === 'pending').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.tx_ref} - {p.customer_name} - {p.amount.toLocaleString()} XAF
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preuves de paiement</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleEvidenceUpload(e.target.files)}
                    className="hidden"
                    id="evidence-upload"
                    accept="image/*,.pdf"
                  />
                  <label htmlFor="evidence-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Cliquez pour uploader ou glissez-déposez vos preuves
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Images (JPG, PNG) ou PDF - Captures d'écran de transactions Orange Money
                    </p>
                  </label>
                </div>

                {evidenceFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {evidenceFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <FileImage className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeEvidenceFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes admin (optionnel)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Ajoutez des notes sur ce paiement..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => selectedPayment && uploadEvidence(selectedPayment.id)}
                  disabled={!selectedPayment || evidenceFiles.length === 0}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  Upload les preuves
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedPayment(null);
                    setEvidenceFiles([]);
                    setAdminNotes('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}