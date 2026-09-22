import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Shield, 
  Settings, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  CreditCard,
  Smartphone,
  RefreshCw,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import FinancialReports from './FinancialReports';
import OrangeMoneyTransferManager from './OrangeMoneyTransferManager';
import ManualPaymentManager from './ManualPaymentManager';
import MilestoneValidationManager from './MilestoneValidationManager';
import AccountCertificationManager from './AccountCertificationManager';
import OrangeMoneyDashboard from './OrangeMoneyDashboard';

interface DashboardStats {
  totalUsers: number;
  activeBookings: number;
  pendingPayments: number;
  pendingMilestones: number;
  totalRevenue: number;
  pendingCertifications: number;
  activeEscrow: number;
  todayTransactions: number;
}

interface AdminActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  admin_name: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeBookings: 0,
    pendingPayments: 0,
    pendingMilestones: 0,
    totalRevenue: 0,
    pendingCertifications: 0,
    activeEscrow: 0,
    todayTransactions: 0,
  });
  const [recentActivities, setRecentActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setCurrentUser(user);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      alert('Accès non autorisé. Réservé aux administrateurs.');
      window.location.href = '/';
      return;
    }

    await loadDashboardData();
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadRecentActivities()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [
        { count: totalUsers },
        { count: activeBookings },
        { data: pendingPayments },
        { data: pendingMilestones },
        { data: pendingCertifications },
        { data: activeEscrow },
        { data: todayTransactions }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('manual_payments').select('amount').eq('status', 'pending'),
        supabase.from('milestones').select('amount').eq('status', 'completed'),
        supabase.from('certifications').select('*').eq('status', 'pending'),
        supabase.from('escrow_accounts').select('total_amount').eq('status', 'active'),
        supabase.from('manual_payments').select('*').eq('status', 'confirmed').gte('created_at', new Date().toISOString().split('T')[0])
      ]);

      const totalRevenue = pendingPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const pendingMilestonesAmount = pendingMilestones?.reduce((sum, m) => sum + m.amount, 0) || 0;
      const activeEscrowAmount = activeEscrow?.reduce((sum, e) => sum + e.total_amount, 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        activeBookings: activeBookings || 0,
        pendingPayments: pendingPayments?.length || 0,
        pendingMilestones: pendingMilestones?.length || 0,
        totalRevenue: totalRevenue + pendingMilestonesAmount + activeEscrowAmount,
        pendingCertifications: pendingCertifications?.length || 0,
        activeEscrow: activeEscrow?.length || 0,
        todayTransactions: todayTransactions?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      // Simuler des activités récentes - en production, utiliser une vraie table d'activités
      setRecentActivities([
        {
          id: '1',
          type: 'payment',
          description: 'Nouveau paiement manuel soumis par Jean Dupont',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          admin_name: 'Système'
        },
        {
          id: '2',
          type: 'milestone',
          description: 'Jalon "Design final" soumis par Tech Solutions',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          admin_name: 'Système'
        },
        {
          id: '3',
          type: 'certification',
          description: 'Certification identité soumise par Marie Curie',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          admin_name: 'Système'
        },
        {
          id: '4',
          type: 'escrow',
          description: 'Nouveau compte escrow créé pour booking #1234',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          admin_name: 'Système'
        },
      ]);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const sidebarItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'financial', label: 'Rapports Financiers', icon: BarChart3 },
    { id: 'transfers', label: 'Transferts Orange Money', icon: Smartphone },
    { id: 'payments', label: 'Paiements Manuels', icon: CreditCard },
    { id: 'milestones', label: 'Validation Jalons', icon: CheckCircle },
    { id: 'certifications', label: 'Certifications', icon: Shield },
    { id: 'orange-dashboard', label: 'Dashboard Orange Money', icon: TrendingUp },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'milestone':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'certification':
        return <Shield className="w-4 h-4 text-purple-500" />;
      case 'escrow':
        return <DollarSign className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Il y a quelques secondes';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} heures`;
    return `Il y a ${Math.floor(seconds / 86400)} jours`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-bold text-gray-900">Tableau de Bord Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold text-sm">A</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Admin</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-orange-50 text-orange-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-6 ${sidebarOpen ? 'ml-64' : ''}`}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h2>
                  <p className="text-gray-600">Bienvenue sur le tableau de bord administrateur</p>
                </div>
                <button
                  onClick={loadDashboardData}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualiser
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <div className="text-sm text-gray-600 mt-1">Utilisateurs</div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-gray-500">Actifs</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.activeBookings}</div>
                  <div className="text-sm text-gray-600 mt-1">Réservations</div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-gray-500">En attente</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                  <div className="text-sm text-gray-600 mt-1">Paiements</div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} XAF</div>
                  <div className="text-sm text-gray-600 mt-1">Revenus</div>
                </div>
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-gray-500">À valider</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.pendingMilestones}</div>
                  <div className="text-sm text-gray-600 mt-1">Jalons</div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-gray-500">En attente</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.pendingCertifications}</div>
                  <div className="text-sm text-gray-600 mt-1">Certifications</div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-gray-500">Actifs</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.activeEscrow}</div>
                  <div className="text-sm text-gray-600 mt-1">Comptes Escrow</div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-gray-500">Aujourd'hui</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.todayTransactions}</div>
                  <div className="text-sm text-gray-600 mt-1">Transactions</div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Activités Récentes</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.admin_name} • {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Actions Rapides</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Valider Paiements</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('milestones')}
                    className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Valider Jalons</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('certifications')}
                    className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Certifications</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('transfers')}
                    className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <Smartphone className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Transferts</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && <FinancialReports />}
          {activeTab === 'transfers' && <OrangeMoneyTransferManager />}
          {activeTab === 'payments' && <ManualPaymentManager isAdmin={true} />}
          {activeTab === 'milestones' && <MilestoneValidationManager isAdmin={true} />}
          {activeTab === 'certifications' && <AccountCertificationManager />}
          {activeTab === 'orange-dashboard' && <OrangeMoneyDashboard />}
        </main>
      </div>
    </div>
  );
}
