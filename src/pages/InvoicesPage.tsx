import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Loader2, Eye, Calendar, DollarSign, CheckCircle, Clock, XCircle, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import type { Invoice, InvoiceStatus } from '@/types';
import { formatDate } from '@/lib/utils';

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  draft: { label: 'Brouillon', color: 'bg-neutral-100 text-neutral-600', icon: FileText },
  sent: { label: 'Envoyée', color: 'bg-primary-100 text-primary-600', icon: Clock },
  paid: { label: 'Payée', color: 'bg-success-100 text-success-600', icon: CheckCircle },
  overdue: { label: 'En retard', color: 'bg-error-100 text-error-600', icon: XCircle },
  cancelled: { label: 'Annulée', color: 'bg-neutral-100 text-neutral-400', icon: XCircle },
};

export default function InvoicesPage() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadInvoices();
  }, [user, navigate, statusFilter]);

  async function loadInvoices() {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from('invoices')
        .select('id, invoice_number, client_id, provider_id, booking_id, subscription_id, type, status, amount, currency, tax_amount, total_amount, due_date, paid_date, notes, created_at, updated_at')
        .eq('client_id', user.id);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data } = await query.order('created_at', { ascending: false });
      setInvoices(data as Invoice[] ?? []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  }

  async function downloadInvoice(invoice: Invoice) {
    // In a real implementation, this would generate a PDF
    const invoiceData = {
      invoice_number: invoice.invoice_number,
      amount: invoice.total_amount,
      currency: invoice.currency,
      due_date: invoice.due_date,
      status: invoice.status,
    };

    const blob = new Blob([JSON.stringify(invoiceData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoice_number}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const filteredInvoices = statusFilter === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === statusFilter);

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Factures</h1>
          <p className="text-neutral-600">Gérez vos factures et paiements</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary-100 text-primary-600">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Total</p>
                <p className="text-2xl font-bold text-neutral-900">{totalAmount.toFixed(2)} €</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success-100 text-success-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Payé</p>
                <p className="text-2xl font-bold text-neutral-900">{paidAmount.toFixed(2)} €</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-warning-100 text-warning-600">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm text-neutral-600">En attente</p>
                <p className="text-2xl font-bold text-neutral-900">{pendingAmount.toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-3">
            <Filter size={20} className="text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
              className="input-field text-sm py-2"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillons</option>
              <option value="sent">Envoyées</option>
              <option value="paid">Payées</option>
              <option value="overdue">En retard</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText size={64} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Aucune facture</h3>
            <p className="text-neutral-600">
              {statusFilter === 'all' 
                ? 'Vous n\'avez pas encore de factures.' 
                : `Aucune facture avec le statut "${statusFilter}".`}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredInvoices.map((invoice) => {
                  const config = statusConfig[invoice.status];
                  const StatusIcon = config.icon;
                  return (
                    <tr key={invoice.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-neutral-900">
                          {invoice.invoice_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {formatDate(invoice.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {invoice.type === 'booking' ? 'Réservation' : invoice.type === 'subscription' ? 'Abonnement' : 'Personnalisé'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon size={12} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-neutral-900">
                        {Number(invoice.total_amount).toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => downloadInvoice(invoice)}
                          className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <Download size={16} />
                          Télécharger
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
