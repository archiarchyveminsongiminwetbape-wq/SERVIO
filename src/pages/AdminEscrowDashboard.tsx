import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ManualPaymentConfirmation from '@/components/ManualPaymentConfirmation';
import { 
  Shield, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  User,
  CreditCard
} from 'lucide-react';

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
  bookings: {
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
}

interface Certification {
  id: string;
  user_id: string;
  certification_type: string;
  status: string;
  submitted_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  evidence_data: any;
  profiles?: {
    full_name: string;
    email: string;
  };
}

// Simple UI components without className props to avoid type errors
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200">{children}</div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 border-b border-gray-200">{children}</div>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-semibold">{children}</h3>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4">{children}</div>
);

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  variant?: 'primary' | 'outline' | 'destructive';
  type?: 'button' | 'submit';
}) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]}`}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'secondary' }) => {
  const variantStyles = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variantStyles[variant]}`}>
      {children}
    </span>
  );
};

export default function AdminEscrowDashboard() {
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);
  const [pendingMilestones, setPendingMilestones] = useState<Milestone[]>([]);
  const [pendingCertifications, setPendingCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('escrow');

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
        loadEscrowAccounts(),
        loadPendingMilestones(),
        loadPendingCertifications()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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

  const loadPendingMilestones = async () => {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) throw error;
    setPendingMilestones(data || []);
  };

  const loadPendingCertifications = async () => {
    const { data, error } = await supabase
      .from('account_certifications')
      .select(`
        *,
        profiles (
          full_name,
          email
        )
      `)
      .in('status', ['submitted', 'under_review'])
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    setPendingCertifications(data || []);
  };

  const approveMilestone = async (milestoneId: string) => {
    try {
      const response = await fetch('/api/admin/approve-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_id: milestoneId,
          admin_id: currentUser.id
        })
      });

      const result = await response.json();
      if (result.success) {
        await loadPendingMilestones();
        await loadEscrowAccounts();
        alert('Jalon approuvé avec succès!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error approving milestone:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const rejectMilestone = async (milestoneId: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/reject-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_id: milestoneId,
          admin_id: currentUser.id,
          rejection_reason: reason
        })
      });

      const result = await response.json();
      if (result.success) {
        await loadPendingMilestones();
        alert('Jalon rejeté');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error rejecting milestone:', error);
      alert('Erreur lors du rejet');
    }
  };

  const releaseFunds = async (escrowId: string, milestoneId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir libérer ces fonds?')) return;

    try {
      const response = await fetch('/api/admin/release-escrow-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrow_id: escrowId,
          milestone_id: milestoneId,
          admin_id: currentUser.id
        })
      });

      const result = await response.json();
      if (result.success) {
        await loadEscrowAccounts();
        await loadPendingMilestones();
        alert('Fonds libérés avec succès!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error releasing funds:', error);
      alert('Erreur lors de la libération des fonds');
    }
  };

  const approveCertification = async (certificationId: string) => {
    try {
      const response = await fetch('/api/admin/review-certification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certification_id: certificationId,
          admin_id: currentUser.id,
          approved: true
        })
      });

      const result = await response.json();
      if (result.success) {
        await loadPendingCertifications();
        alert('Certification approuvée!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error approving certification:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const rejectCertification = async (certificationId: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/review-certification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certification_id: certificationId,
          admin_id: currentUser.id,
          approved: false,
          rejection_reason: reason
        })
      });

      const result = await response.json();
      if (result.success) {
        await loadPendingCertifications();
        alert('Certification rejetée');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error rejecting certification:', error);
      alert('Erreur lors du rejet');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-neutral-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau de Bord Admin - Escrow & Certifications</h1>
        <p className="text-gray-600">Gérez les paiements séquestrés et certifiez les comptes utilisateurs</p>
      </div>

      {/* Simple Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setSelectedTab('escrow')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            selectedTab === 'escrow' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <CreditCard className="w-4 h-4 mr-2 inline" />
          Comptes Escrow
        </button>
        <button
          onClick={() => setSelectedTab('milestones')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            selectedTab === 'milestones' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <FileText className="w-4 h-4 mr-2 inline" />
          Jalons en Attente
        </button>
        <button
          onClick={() => setSelectedTab('certifications')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            selectedTab === 'certifications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Shield className="w-4 h-4 mr-2 inline" />
          Certifications
        </button>
        <button
          onClick={() => setSelectedTab('payments')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            selectedTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <DollarSign className="w-4 h-4 mr-2 inline" />
          Paiements Manuels
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'escrow' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <div className="text-sm font-medium">Total en Escrow</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {escrowAccounts.reduce((sum, acc) => sum + acc.amount_remaining, 0).toLocaleString()} XAF
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="text-sm font-medium">Comptes Actifs</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{escrowAccounts.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="text-sm font-medium">Fonds Libérés</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {escrowAccounts.reduce((sum, acc) => sum + acc.amount_released, 0).toLocaleString()} XAF
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {escrowAccounts.map((escrow) => (
              <Card key={escrow.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-semibold">
                        {escrow.bookings?.service_type || 'Service'}
                      </div>
                      <p className="text-sm text-gray-600">
                        Client: {escrow.bookings?.profiles?.full_name} | 
                        Prestataire: {escrow.bookings?.provider_profiles?.business_name}
                      </p>
                    </div>
                    <Badge variant={escrow.status === 'funded' ? 'default' : 'secondary'}>
                      {escrow.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
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
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${escrow.release_percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Financé le: {new Date(escrow.funded_at).toLocaleDateString('fr-FR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'milestones' && (
        <div className="space-y-4">
          {pendingMilestones.length === 0 ? (
            <Card>
              <CardContent>
                <div className="py-8 text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4" />
                  <p>Aucun jalon en attente de validation</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingMilestones.map((milestone) => (
              <Card key={milestone.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-semibold">{milestone.title}</div>
                      <p className="text-sm text-gray-600">{milestone.description}</p>
                    </div>
                    <Badge variant="secondary">Soumis</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Montant</p>
                      <p className="font-semibold">{milestone.amount.toLocaleString()} XAF</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pourcentage</p>
                      <p className="font-semibold">{milestone.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Soumis le</p>
                      <p className="font-semibold">
                        {milestone.completed_at ? new Date(milestone.completed_at).toLocaleDateString('fr-FR') : '-'}
                      </p>
                    </div>
                  </div>

                  {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Preuves de travail:</p>
                      <div className="flex flex-wrap gap-2">
                        {milestone.evidence_urls.map((url, index) => (
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

                  <div className="flex gap-2">
                    <Button
                      onClick={() => approveMilestone(milestone.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt('Raison du rejet:');
                        if (reason) rejectMilestone(milestone.id, reason);
                      }}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                    <Button
                      onClick={() => releaseFunds(milestone.escrow_id, milestone.id)}
                      variant="outline"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Libérer Fonds
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {selectedTab === 'certifications' && (
        <div className="space-y-4">
          {pendingCertifications.length === 0 ? (
            <Card>
              <CardContent>
                <div className="py-8 text-center text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4" />
                  <p>Aucune certification en attente</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingCertifications.map((cert) => (
              <Card key={cert.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-semibold flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        {cert.profiles?.full_name}
                      </div>
                      <p className="text-sm text-gray-600">{cert.profiles?.email}</p>
                    </div>
                    <Badge variant="secondary">{cert.certification_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-semibold capitalize">{cert.certification_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Statut</p>
                      <p className="font-semibold capitalize">{cert.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Soumis le</p>
                      <p className="font-semibold">
                        {cert.submitted_at ? new Date(cert.submitted_at).toLocaleDateString('fr-FR') : '-'}
                      </p>
                    </div>
                  </div>

                  {cert.evidence_data && Object.keys(cert.evidence_data).length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm font-medium mb-1">Données soumises:</p>
                      <pre className="text-xs overflow-auto max-h-32">
                        {JSON.stringify(cert.evidence_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => approveCertification(cert.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt('Raison du rejet:');
                        if (reason) rejectCertification(cert.id, reason);
                      }}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {selectedTab === 'payments' && (
        <ManualPaymentConfirmation adminId={currentUser?.id} />
      )}
    </div>
  );
}
