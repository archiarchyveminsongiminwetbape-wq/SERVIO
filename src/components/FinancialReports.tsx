import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Users, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Smartphone,
  Building,
  Shield,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface FinancialData {
  totalRevenue: number;
  totalTransfers: number;
  totalEscrow: number;
  totalReleased: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  orangeMoneyRevenue: number;
  manualPaymentsRevenue: number;
  avgTransactionAmount: number;
  revenueGrowth: number;
  transactionsGrowth: number;
}

interface RevenueByPeriod {
  period: string;
  revenue: number;
  transactions: number;
}

interface RevenueByMethod {
  method: string;
  amount: number;
  percentage: number;
  transactions: number;
}

interface TopProvider {
  provider_id: string;
  business_name: string;
  total_revenue: number;
  total_transactions: number;
  avg_amount: number;
}

export default function FinancialReports() {
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 0,
    totalTransfers: 0,
    totalEscrow: 0,
    totalReleased: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    orangeMoneyRevenue: 0,
    manualPaymentsRevenue: 0,
    avgTransactionAmount: 0,
    revenueGrowth: 0,
    transactionsGrowth: 0,
  });
  const [revenueByPeriod, setRevenueByPeriod] = useState<RevenueByPeriod[]>([]);
  const [revenueByMethod, setRevenueByMethod] = useState<RevenueByMethod[]>([]);
  const [topProviders, setTopProviders] = useState<TopProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'transactions'>('revenue');

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFinancialOverview(),
        loadRevenueByPeriod(),
        loadRevenueByMethod(),
        loadTopProviders()
      ]);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialOverview = async () => {
    try {
      // Simuler des données pour l'instant - en production, utiliser des vraies requêtes SQL
      const { data: payments } = await supabase
        .from('manual_payments')
        .select('amount, currency, status, payment_method');

      const { data: transfers } = await supabase
        .from('transfers')
        .select('amount, currency, status');

      const { data: escrowAccounts } = await supabase
        .from('escrow_accounts')
        .select('total_amount, amount_released, amount_remaining, status');

      if (payments) {
        const totalRevenue = payments
          .filter(p => p.status === 'confirmed')
          .reduce((sum, p) => sum + p.amount, 0);

        const orangeMoneyRevenue = payments
          .filter(p => p.status === 'confirmed' && p.payment_method === 'orange_money')
          .reduce((sum, p) => sum + p.amount, 0);

        const manualPaymentsRevenue = payments
          .filter(p => p.status === 'confirmed' && p.payment_method === 'manual')
          .reduce((sum, p) => sum + p.amount, 0);

        const pendingPayments = payments.filter(p => p.status === 'pending').length;
        const completedPayments = payments.filter(p => p.status === 'confirmed').length;
        const failedPayments = payments.filter(p => p.status === 'rejected').length;

        const avgTransactionAmount = payments.length > 0 
          ? totalRevenue / completedPayments 
          : 0;

        setFinancialData({
          totalRevenue,
          totalTransfers: transfers?.length || 0,
          totalEscrow: escrowAccounts?.reduce((sum, e) => sum + e.total_amount, 0) || 0,
          totalReleased: escrowAccounts?.reduce((sum, e) => sum + e.amount_released, 0) || 0,
          pendingPayments,
          completedPayments,
          failedPayments,
          orangeMoneyRevenue,
          manualPaymentsRevenue,
          avgTransactionAmount,
          revenueGrowth: 12.5, // Simulé
          transactionsGrowth: 8.3, // Simulé
        });
      }
    } catch (error) {
      console.error('Error loading financial overview:', error);
    }
  };

  const loadRevenueByPeriod = async () => {
    try {
      // Simuler des données par période
      const periods = {
        '7d': [
          { period: 'Lun', revenue: 150000, transactions: 5 },
          { period: 'Mar', revenue: 230000, transactions: 8 },
          { period: 'Mer', revenue: 180000, transactions: 6 },
          { period: 'Jeu', revenue: 320000, transactions: 12 },
          { period: 'Ven', revenue: 410000, transactions: 15 },
          { period: 'Sam', revenue: 280000, transactions: 10 },
          { period: 'Dim', revenue: 190000, transactions: 7 },
        ],
        '30d': [
          { period: 'Semaine 1', revenue: 1200000, transactions: 45 },
          { period: 'Semaine 2', revenue: 1450000, transactions: 52 },
          { period: 'Semaine 3', revenue: 1380000, transactions: 48 },
          { period: 'Semaine 4', revenue: 1620000, transactions: 58 },
        ],
        '90d': [
          { period: 'Mois 1', revenue: 4500000, transactions: 180 },
          { period: 'Mois 2', revenue: 5200000, transactions: 210 },
          { period: 'Mois 3', revenue: 5800000, transactions: 235 },
        ],
        '1y': [
          { period: 'Q1', revenue: 12000000, transactions: 480 },
          { period: 'Q2', revenue: 15000000, transactions: 600 },
          { period: 'Q3', revenue: 18000000, transactions: 720 },
          { period: 'Q4', revenue: 22000000, transactions: 880 },
        ],
      };

      setRevenueByPeriod(periods[selectedPeriod]);
    } catch (error) {
      console.error('Error loading revenue by period:', error);
    }
  };

  const loadRevenueByMethod = async () => {
    try {
      const { data: payments } = await supabase
        .from('manual_payments')
        .select('amount, payment_method')
        .eq('status', 'confirmed');

      if (payments) {
        const methodMap = new Map<string, { amount: number; transactions: number }>();

        payments.forEach(payment => {
          const method = payment.payment_method || 'other';
          const current = methodMap.get(method) || { amount: 0, transactions: 0 };
          current.amount += payment.amount;
          current.transactions += 1;
          methodMap.set(method, current);
        });

        const totalAmount = Array.from(methodMap.values()).reduce((sum, m) => sum + m.amount, 0);

        const methodData = Array.from(methodMap.entries()).map(([method, data]) => ({
          method,
          amount: data.amount,
          percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
          transactions: data.transactions,
        }));

        setRevenueByMethod(methodData);
      }
    } catch (error) {
      console.error('Error loading revenue by method:', error);
    }
  };

  const loadTopProviders = async () => {
    try {
      // Simuler des données de top providers
      setTopProviders([
        {
          provider_id: '1',
          business_name: 'Digital Solutions Cameroun',
          total_revenue: 2500000,
          total_transactions: 45,
          avg_amount: 55555,
        },
        {
          provider_id: '2',
          business_name: 'Tech Services Pro',
          total_revenue: 1800000,
          total_transactions: 38,
          avg_amount: 47368,
        },
        {
          provider_id: '3',
          business_name: 'Marketing Expert',
          total_revenue: 1200000,
          total_transactions: 28,
          avg_amount: 42857,
        },
        {
          provider_id: '4',
          business_name: 'Web Dev Studio',
          total_revenue: 950000,
          total_transactions: 22,
          avg_amount: 43181,
        },
        {
          provider_id: '5',
          business_name: 'Consulting Group',
          total_revenue: 780000,
          total_transactions: 18,
          avg_amount: 43333,
        },
      ]);
    } catch (error) {
      console.error('Error loading top providers:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} XAF`;
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
      manual: 'Manuel',
      other: 'Autre',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Chargement des rapports financiers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Rapports Financiers</h2>
          <p className="text-gray-600">Analyse complète des revenus et transactions</p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
            <option value="1y">1 an</option>
          </select>
          <button
            onClick={loadFinancialData}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-sm font-medium">{financialData.revenueGrowth}%</span>
            </div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(financialData.totalRevenue)}</div>
          <div className="text-sm text-gray-600 mt-1">Revenu total</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-sm font-medium">{financialData.transactionsGrowth}%</span>
            </div>
          </div>
          <div className="text-2xl font-bold">{financialData.totalTransfers}</div>
          <div className="text-sm text-gray-600 mt-1">Transferts</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">En escrow</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(financialData.totalEscrow)}</div>
          <div className="text-sm text-gray-600 mt-1">Fonds bloqués</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500">Libérés</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(financialData.totalReleased)}</div>
          <div className="text-sm text-gray-600 mt-1">Fonds distribués</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Period Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Revenus par période</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMetric('revenue')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  selectedMetric === 'revenue' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Revenus
              </button>
              <button
                onClick={() => setSelectedMetric('transactions')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  selectedMetric === 'transactions' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Transactions
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {revenueByPeriod.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">{item.period}</div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-orange-500 h-4 rounded-full transition-all"
                      style={{
                        width: `${(item[selectedMetric] / Math.max(...revenueByPeriod.map(d => d[selectedMetric]))) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div className="w-32 text-right">
                  <div className="font-semibold">
                    {selectedMetric === 'revenue' 
                      ? formatCurrency(item.revenue) 
                      : item.transactions}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Method */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-6">Revenus par méthode de paiement</h3>

          <div className="space-y-4">
            {revenueByMethod.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  {getMethodIcon(item.method)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{getMethodLabel(item.method)}</span>
                    <span className="text-sm text-gray-600">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-32 text-right">
                  <div className="font-semibold text-sm">{formatCurrency(item.amount)}</div>
                  <div className="text-xs text-gray-500">{item.transactions} transactions</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-6">Statut des paiements</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{financialData.pendingPayments}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{financialData.completedPayments}</div>
              <div className="text-sm text-gray-600">Complétés</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{financialData.failedPayments}</div>
              <div className="text-sm text-gray-600">Échoués</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Providers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Top Prestataires</h3>
          <Users className="w-5 h-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prestataire</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenu total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moyenne</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topProviders.map((provider, index) => (
                <tr key={provider.provider_id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold">
                        {index + 1}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{provider.business_name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-semibold">{formatCurrency(provider.total_revenue)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {provider.total_transactions}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(provider.avg_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orange Money Specific Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Statistiques Orange Money</h3>
            <p className="text-sm text-gray-600">Performance spécifique aux paiements Orange Money</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Revenu Orange Money</div>
            <div className="text-2xl font-bold text-orange-700">{formatCurrency(financialData.orangeMoneyRevenue)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {((financialData.orangeMoneyRevenue / financialData.totalRevenue) * 100).toFixed(1)}% du total
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Revenu paiements manuels</div>
            <div className="text-2xl font-bold text-orange-700">{formatCurrency(financialData.manualPaymentsRevenue)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {((financialData.manualPaymentsRevenue / financialData.totalRevenue) * 100).toFixed(1)}% du total
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Moyenne par transaction</div>
            <div className="text-2xl font-bold text-orange-700">{formatCurrency(financialData.avgTransactionAmount)}</div>
            <div className="text-xs text-gray-500 mt-1">Toutes méthodes confondues</div>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
          <Download className="w-4 h-4" />
          Exporter les rapports
        </button>
      </div>
    </div>
  );
}