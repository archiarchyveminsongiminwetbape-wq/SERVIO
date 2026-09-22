import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Clock, AlertCircle, Upload, Eye, FileText, CreditCard } from 'lucide-react';

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
  admin_notes?: string;
  evidence_urls?: string[];
  created_at: string;
  confirmed_at?: string;
}

export default function ManualPaymentConfirmation({ adminId }: { adminId: string }) {
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<ManualPayment | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('manual_payments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      setError('Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!selectedPayment) return;

    try {
      setConfirming(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/manual-payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: selectedPayment.id,
          admin_id: adminId,
          admin_notes: adminNotes,
          evidence_urls: selectedPayment.evidence_urls
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Paiement confirmé avec succès!');
        setSelectedPayment(null);
        setAdminNotes('');
        await loadPendingPayments();
      } else {
        setError(result.error || 'Erreur lors de la confirmation');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      setError('Erreur lors de la confirmation du paiement');
    } finally {
      setConfirming(false);
    }
  };

  const rejectPayment = async (paymentId: string, reason: string) => {
    try {
      const response = await fetch('/api/manual-payment/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          admin_id: adminId,
          rejection_reason: reason
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Paiement rejeté');
        await loadPendingPayments();
      } else {
        setError(result.error || 'Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      setError('Erreur lors du rejet du paiement');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'orange_money':
        return '🍊';
      case 'mtn_money':
        return '🟡';
      case 'wave':
        return '🌊';
      case 'bank_transfer':
        return '🏦';
      case 'cash':
        return '💵';
      case 'check':
        return '📝';
      default:
        return '💳';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Chargement des paiements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Confirmation de Paiements Manuels</h2>
          <p className="text-gray-600">Review et confirmez les paiements soumis par les clients</p>
        </div>
        <button
          onClick={loadPendingPayments}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Actualiser
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Aucun paiement en attente de confirmation</p>
          <p className="text-sm text-gray-500">Les paiements apparaîtront ici une fois soumis par les clients</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  {getStatusIcon(payment.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{payment.tx_ref}</h4>
                      <span className="text-lg">{getPaymentMethodIcon(payment.payment_method)}</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                        {payment.payment_method.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {payment.amount.toLocaleString()} {payment.currency}
                    </p>
                    <p className="text-sm text-gray-600">
                      Client: {payment.customer_name} ({payment.customer_email})
                    </p>
                    {payment.customer_phone && (
                      <p className="text-sm text-gray-500">Tél: {payment.customer_phone}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Soumis le: {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPayment(payment)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                </div>
              </div>

              {payment.evidence_urls && payment.evidence_urls.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Preuves de paiement:</p>
                  <div className="flex flex-wrap gap-2">
                    {payment.evidence_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm text-blue-600 hover:bg-gray-200"
                      >
                        <FileText className="w-4 h-4" />
                        Preuve {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Confirmation de Paiement</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Référence</p>
                  <p className="font-semibold">{selectedPayment.tx_ref}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-semibold text-green-600">
                    {selectedPayment.amount.toLocaleString()} {selectedPayment.currency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Méthode</p>
                  <p className="font-semibold capitalize">
                    {selectedPayment.payment_method.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-semibold">{selectedPayment.customer_name}</p>
                </div>
              </div>

              {selectedPayment.evidence_urls && selectedPayment.evidence_urls.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Preuves de paiement:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPayment.evidence_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-2 bg-blue-50 rounded text-blue-600 hover:bg-blue-100"
                      >
                        <Upload className="w-4 h-4" />
                        Preuve {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Notes admin (optionnel)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                  placeholder="Ajoutez des notes sur ce paiement..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={confirmPayment}
                  disabled={confirming}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {confirming ? 'Confirmation en cours...' : '✅ Confirmer le paiement'}
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Raison du rejet:');
                    if (reason) rejectPayment(selectedPayment.id, reason);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  ❌ Rejeter
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
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
