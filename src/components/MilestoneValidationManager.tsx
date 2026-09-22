import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { escrowApi } from '@/lib/api/api';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  AlertCircle, 
  DollarSign,
  Shield,
  Search,
  Filter,
  Eye,
  Download,
  Image as ImageIcon,
  Calendar,
  User,
  Building,
  CreditCard,
  TrendingUp,
  Award,
  Zap,
  ArrowRight,
  Upload,
  Trash2,
  X
} from 'lucide-react';

interface Milestone {
  id: string;
  escrow_id: string;
  title: string;
  description: string;
  percentage: number;
  amount: number;
  status: string;
  evidence_urls: string[];
  completed_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  paid_at?: string;
  payment_reference?: string;
  due_date?: string;
  escrow_accounts?: {
    id: string;
    total_amount: number;
    currency: string;
    status: string;
    release_percentage: number;
    amount_released: number;
    amount_remaining: number;
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
  };
}

interface ValidationStats {
  totalMilestones: number;
  pendingMilestones: number;
  approvedMilestones: number;
  rejectedMilestones: number;
  paidMilestones: number;
  totalAmount: number;
  releasedAmount: number;
  pendingAmount: number;
}

export default function MilestoneValidationManager({ isAdmin = false }: { isAdmin?: boolean }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<ValidationStats>({
    totalMilestones: 0,
    pendingMilestones: 0,
    approvedMilestones: 0,
    rejectedMilestones: 0,
    paidMilestones: 0,
    totalAmount: 0,
    releasedAmount: 0,
    pendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submissionNotes, setSubmissionNotes] = useState('');

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
        loadMilestones(),
        calculateStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMilestones = async () => {
    let query = supabase
      .from('milestones')
      .select(`
        *,
        escrow_accounts (
          id,
          total_amount,
          currency,
          status,
          release_percentage,
          amount_released,
          amount_remaining,
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
        )
      `)
      .order('created_at', { ascending: false });

    if (isAdmin) {
      query = query.in('status', ['completed', 'approved', 'rejected']);
    } else {
      // For providers, load their milestones
      query = query.eq('escrow_accounts.bookings.provider_profiles.user_id', currentUser?.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    setMilestones(data || []);
  };

  const calculateStats = () => {
    const totalMilestones = milestones.length;
    const pendingMilestones = milestones.filter(m => m.status === 'completed').length;
    const approvedMilestones = milestones.filter(m => m.status === 'approved').length;
    const rejectedMilestones = milestones.filter(m => m.status === 'rejected').length;
    const paidMilestones = milestones.filter(m => m.status === 'paid').length;
    
    const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
    const releasedAmount = milestones
      .filter(m => m.status === 'paid')
      .reduce((sum, m) => sum + m.amount, 0);
    const pendingAmount = milestones
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + m.amount, 0);

    setStats({
      totalMilestones,
      pendingMilestones,
      approvedMilestones,
      rejectedMilestones,
      paidMilestones,
      totalAmount,
      releasedAmount,
      pendingAmount,
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

  const submitMilestone = async () => {
    if (!selectedMilestone || !currentUser) return;

    try {
      setActionLoading(true);

      // Upload evidence files
      const uploadedUrls: string[] = [];
      for (const file of evidenceFiles) {
        const fileName = `milestone-${selectedMilestone.id}-${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('milestone-evidence')
          .upload(fileName, file);

        if (error) throw error;

        if (data?.path) {
          const { data: { publicUrl } } = supabase.storage
            .from('milestone-evidence')
            .getPublicUrl(data.path);
          uploadedUrls.push(publicUrl);
        }
      }

      const result = await escrowApi.submitMilestone(
        selectedMilestone.id,
        currentUser.id,
        uploadedUrls,
        submissionNotes
      );

      if (result.success) {
        setShowSubmissionModal(false);
        setEvidenceFiles([]);
        setSubmissionNotes('');
        setSelectedMilestone(null);
        await loadAllData();
        alert('Jalon soumis avec succès!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting milestone:', error);
      alert('Erreur lors de la soumission');
    } finally {
      setActionLoading(false);
    }
  };

  const approveMilestone = async (milestoneId: string) => {
    if (!currentUser) return;
    setActionLoading(true);

    try {
      const result = await escrowApi.approveMilestone(milestoneId, currentUser.id);
      
      if (result.success) {
        await loadAllData();
        setShowDetailModal(false);
        alert('Jalon approuvé avec succès!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error approving milestone:', error);
      alert('Erreur lors de l\'approbation');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectMilestone = async (milestoneId: string, reason: string) => {
    if (!currentUser) return;
    setActionLoading(true);

    try {
      const result = await escrowApi.rejectMilestone(milestoneId, currentUser.id, reason);
      
      if (result.success) {
        await loadAllData();
        setShowDetailModal(false);
        alert('Jalon rejeté');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error rejecting milestone:', error);
      alert('Erreur lors du rejet');
    } finally {
      setActionLoading(false);
    }
  };

  const releaseFunds = async (escrowId: string, milestoneId: string) => {
    if (!currentUser) return;
    if (!confirm('Êtes-vous sûr de vouloir libérer ces fonds? Cette action est irréversible.')) return;

    setActionLoading(true);

    try {
      const result = await escrowApi.releaseEscrowFunds(escrowId, milestoneId, currentUser.id);
      
      if (result.success) {
        await loadAllData();
        setShowDetailModal(false);
        alert('Fonds libérés avec succès!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error releasing funds:', error);
      alert('Erreur lors de la libération des fonds');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMilestones = milestones.filter(m => {
    const matchesSearch = 
      m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.escrow_accounts?.bookings?.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.escrow_accounts?.bookings?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.escrow_accounts?.bookings?.provider_profiles?.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <DollarSign className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'completed':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      case 'completed':
        return 'Soumis';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Chargement des jalons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Jalons</h2>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Validez le travail accompli et libérez les fonds' 
              : 'Soumettez vos jalons pour validation'}
          </p>
        </div>
        
        {!isAdmin && (
          <button
            onClick={() => setShowSubmissionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Soumettre un jalon
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalMilestones}</div>
          <div className="text-sm text-gray-600 mt-1">Jalons</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">En attente</span>
          </div>
          <div className="text-2xl font-bold">{stats.pendingMilestones}</div>
          <div className="text-sm text-gray-600 mt-1">{stats.pendingAmount.toLocaleString()} XAF</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">Approuvés</span>
          </div>
          <div className="text-2xl font-bold">{stats.approvedMilestones}</div>
          <div className="text-sm text-gray-600 mt-1">Prêts pour paiement</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">Payés</span>
          </div>
          <div className="text-2xl font-bold">{stats.paidMilestones}</div>
          <div className="text-sm text-gray-600 mt-1">{stats.releasedAmount.toLocaleString()} XAF</div>
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
                placeholder="Rechercher par titre, service, client ou prestataire..."
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
            <option value="completed">Soumis (en attente)</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
            <option value="paid">Payés</option>
          </select>
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-4">
        {filteredMilestones.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Aucun jalon trouvé</p>
            <p className="text-sm text-gray-500">
              {isAdmin 
                ? 'Aucun jalon en attente de validation' 
                : 'Commencez par soumettre vos premiers jalons'}
            </p>
          </div>
        ) : (
          filteredMilestones.map((milestone) => (
            <div key={milestone.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{milestone.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(milestone.status)}`}>
                      {getStatusIcon(milestone.status)}
                      <span className="ml-1">{getStatusText(milestone.status)}</span>
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                  
                  {milestone.escrow_accounts?.bookings && (
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {milestone.escrow_accounts.bookings.service_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Client: {milestone.escrow_accounts.bookings.profiles?.full_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        Prestataire: {milestone.escrow_accounts.bookings.provider_profiles?.business_name}
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setSelectedMilestone(milestone);
                    setShowDetailModal(true);
                  }}
                  className="text-orange-600 hover:text-orange-900 font-medium text-sm"
                >
                  Voir détails
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-semibold">{milestone.amount.toLocaleString()} {milestone.escrow_accounts?.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pourcentage</p>
                  <p className="font-semibold">{milestone.percentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date limite</p>
                  <p className="font-semibold">
                    {milestone.due_date 
                      ? new Date(milestone.due_date).toLocaleDateString('fr-FR')
                      : 'Non définie'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Progression escrow</p>
                  <p className="font-semibold">
                    {milestone.escrow_accounts?.release_percentage || 0}%
                  </p>
                </div>
              </div>

              {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Preuves de travail ({milestone.evidence_urls.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {milestone.evidence_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded text-sm text-blue-600 hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        Preuve {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {milestone.rejection_reason && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Raison du rejet:</strong> {milestone.rejection_reason}
                </div>
              )}

              {/* Progress bar for escrow */}
              {milestone.escrow_accounts && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progression du paiement</span>
                    <span>{milestone.escrow_accounts.release_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all" 
                      style={{ width: `${milestone.escrow_accounts.release_percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && milestone.status === 'completed' && (
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => approveMilestone(milestone.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading ? 'Traitement...' : 'Approuver'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Raison du rejet:');
                      if (reason) rejectMilestone(milestone.id, reason);
                    }}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {actionLoading ? 'Traitement...' : 'Rejeter'}
                  </button>
                </div>
              )}

              {/* Release Funds Action */}
              {isAdmin && milestone.status === 'approved' && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => releaseFunds(milestone.escrow_id, milestone.id)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <DollarSign className="w-4 h-4" />
                    {actionLoading ? 'Traitement...' : `Libérer ${milestone.amount.toLocaleString()} XAF`}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedMilestone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Détails du jalon</h3>
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
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${getStatusColor(selectedMilestone.status)}`}>
                  {getStatusIcon(selectedMilestone.status)}
                </div>
                <div>
                  <h4 className="text-lg font-semibold">{selectedMilestone.title}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedMilestone.status)}`}>
                    {getStatusText(selectedMilestone.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-semibold text-lg">
                    {selectedMilestone.amount.toLocaleString()} {selectedMilestone.escrow_accounts?.currency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pourcentage</p>
                  <p className="font-semibold text-lg">{selectedMilestone.percentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="font-semibold">
                    {new Date(selectedMilestone.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date limite</p>
                  <p className="font-semibold">
                    {selectedMilestone.due_date 
                      ? new Date(selectedMilestone.due_date).toLocaleDateString('fr-FR')
                      : 'Non définie'}
                  </p>
                </div>
              </div>

              {selectedMilestone.description && (
                <div>
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-sm text-gray-600">{selectedMilestone.description}</p>
                </div>
              )}

              {selectedMilestone.escrow_accounts?.bookings && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Détails du projet</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Service</p>
                      <p className="font-semibold">{selectedMilestone.escrow_accounts.bookings.service_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Client</p>
                      <p className="font-semibold">{selectedMilestone.escrow_accounts.bookings.profiles?.full_name}</p>
                      <p className="text-xs text-gray-500">{selectedMilestone.escrow_accounts.bookings.profiles?.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Prestataire</p>
                      <p className="font-semibold">{selectedMilestone.escrow_accounts.bookings.provider_profiles?.business_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total escrow</p>
                      <p className="font-semibold">
                        {selectedMilestone.escrow_accounts.total_amount.toLocaleString()} {selectedMilestone.escrow_accounts.currency}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedMilestone.evidence_urls && selectedMilestone.evidence_urls.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Preuves de travail</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedMilestone.evidence_urls.map((url, index) => (
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

              {selectedMilestone.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800">Raison du rejet</p>
                  <p className="text-sm text-red-700">{selectedMilestone.rejection_reason}</p>
                </div>
              )}

              {/* Dates tracking */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Créé le</p>
                  <p className="font-semibold">
                    {new Date(selectedMilestone.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {selectedMilestone.completed_at && (
                  <div>
                    <p className="text-gray-600">Soumis le</p>
                    <p className="font-semibold">
                      {new Date(selectedMilestone.completed_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {selectedMilestone.approved_at && (
                  <div>
                    <p className="text-gray-600">Approuvé le</p>
                    <p className="font-semibold">
                      {new Date(selectedMilestone.approved_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {selectedMilestone.paid_at && (
                  <div>
                    <p className="text-gray-600">Payé le</p>
                    <p className="font-semibold">
                      {new Date(selectedMilestone.paid_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && selectedMilestone.status === 'completed' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => approveMilestone(selectedMilestone.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading ? 'Traitement...' : 'Approuver'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Raison du rejet:');
                      if (reason) rejectMilestone(selectedMilestone.id, reason);
                    }}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {actionLoading ? 'Traitement...' : 'Rejeter'}
                  </button>
                </div>
              )}

              {isAdmin && selectedMilestone.status === 'approved' && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => releaseFunds(selectedMilestone.escrow_id, selectedMilestone.id)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <DollarSign className="w-4 h-4" />
                    {actionLoading ? 'Traitement...' : `Libérer ${selectedMilestone.amount.toLocaleString()} XAF`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Soumettre un jalon</h3>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sélectionner un jalon</label>
                <select
                  value={selectedMilestone?.id || ''}
                  onChange={(e) => {
                    const milestone = milestones.find(m => m.id === e.target.value);
                    setSelectedMilestone(milestone || null);
                  }}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez un jalon...</option>
                  {milestones.filter(m => m.status === 'pending').map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} - {m.amount.toLocaleString()} XAF
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preuves de travail</label>
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
                      Images (JPG, PNG) ou PDF
                    </p>
                  </label>
                </div>

                {evidenceFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {evidenceFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-gray-500" />
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
                <label className="block text-sm font-medium mb-2">Notes (optionnel)</label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Décrivez le travail accompli..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={submitMilestone}
                  disabled={actionLoading || !selectedMilestone || evidenceFiles.length === 0}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'Soumission en cours...' : 'Soumettre'}
                </button>
                <button
                  onClick={() => {
                    setShowSubmissionModal(false);
                    setSelectedMilestone(null);
                    setEvidenceFiles([]);
                    setSubmissionNotes('');
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