import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Edit, 
  Check, 
  X, 
  RefreshCw,
  Filter,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  User,
  Eye,
  Download,
  Trash2,
  FileText
} from 'lucide-react';

interface Booking {
  id: string;
  client_id: string;
  provider_id: string;
  service_type: string;
  scheduled_at: string;
  duration_minutes: number;
  location_type: string;
  location_address?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  price: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  client?: {
    full_name: string;
    email: string;
  };
  provider?: {
    business_name: string;
  };
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:profiles!bookings_client_id_fkey(full_name, email),
          provider:provider_profiles!bookings_provider_id_fkey(business_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.provider?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || booking.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      await loadBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentStatusChange = async (bookingId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      await loadBookings();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Erreur lors de la mise à jour du statut de paiement');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;
      await loadBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'held':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
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
          <h2 className="text-2xl font-bold">Gestion des Réservations</h2>
          <p className="text-gray-600">Gérez toutes les réservations de la plateforme</p>
        </div>
        <button
          onClick={loadBookings}
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
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold">{bookings.length}</div>
          <div className="text-sm text-gray-600">Réservations</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-xs text-gray-500">En attente</span>
          </div>
          <div className="text-2xl font-bold">{bookings.filter(b => b.status === 'pending').length}</div>
          <div className="text-sm text-gray-600">En attente</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-xs text-gray-500">Confirmées</span>
          </div>
          <div className="text-2xl font-bold">{bookings.filter(b => b.status === 'confirmed').length}</div>
          <div className="text-sm text-gray-600">Confirmées</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-gray-500">Revenus</span>
          </div>
          <div className="text-2xl font-bold">
            {bookings
              .filter(b => b.payment_status === 'completed')
              .reduce((sum, b) => sum + b.price, 0)
              .toLocaleString()} XAF
          </div>
          <div className="text-sm text-gray-600">Total payé</div>
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
                placeholder="Rechercher par client, prestataire, service..."
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
            <option value="confirmed">Confirmées</option>
            <option value="completed">Terminées</option>
            <option value="cancelled">Annulées</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Tous les paiements</option>
            <option value="pending">En attente</option>
            <option value="processing">En cours</option>
            <option value="held">Retenu</option>
            <option value="completed">Payé</option>
            <option value="failed">Échoué</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prestataire</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    #{booking.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{booking.client?.full_name}</div>
                        <div className="text-xs text-gray-500">{booking.client?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {booking.provider?.business_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {booking.service_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(booking.scheduled_at).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.price.toLocaleString()} {booking.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(booking.status)}`}>
                      {booking.status === 'confirmed' ? 'Confirmée' : 
                       booking.status === 'completed' ? 'Terminée' :
                       booking.status === 'cancelled' ? 'Annulée' :
                       booking.status === 'no_show' ? 'Non présent' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadgeColor(booking.payment_status)}`}>
                      {booking.payment_status === 'completed' ? 'Payé' : 
                       booking.payment_status === 'processing' ? 'En cours' :
                       booking.payment_status === 'held' ? 'Retenu' :
                       booking.payment_status === 'failed' ? 'Échoué' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(booking.id, 'confirmed')}
                          disabled={actionLoading}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={actionLoading}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Détails de la réservation</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="text-sm font-medium">{selectedBooking.client?.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedBooking.client?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prestataire</p>
                  <p className="text-sm font-medium">{selectedBooking.provider?.business_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Service</p>
                  <p className="text-sm font-medium">{selectedBooking.service_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Durée</p>
                  <p className="text-sm font-medium">{selectedBooking.duration_minutes} minutes</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-sm font-medium">{new Date(selectedBooking.scheduled_at).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lieu</p>
                  <p className="text-sm font-medium">
                    {selectedBooking.location_type === 'in_person' ? 'En présentiel' :
                     selectedBooking.location_type === 'remote' ? 'À distance' : 'Hybride'}
                  </p>
                  {selectedBooking.location_address && (
                    <p className="text-xs text-gray-500">{selectedBooking.location_address}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Prix</p>
                  <p className="text-sm font-medium">{selectedBooking.price.toLocaleString()} {selectedBooking.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Méthode de paiement</p>
                  <p className="text-sm font-medium">{selectedBooking.payment_method}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Statut réservation</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedBooking.status)}`}>
                    {selectedBooking.status === 'confirmed' ? 'Confirmée' : 
                     selectedBooking.status === 'completed' ? 'Terminée' :
                     selectedBooking.status === 'cancelled' ? 'Annulée' :
                     selectedBooking.status === 'no_show' ? 'Non présent' : 'En attente'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut paiement</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadgeColor(selectedBooking.payment_status)}`}>
                    {selectedBooking.payment_status === 'completed' ? 'Payé' : 
                     selectedBooking.payment_status === 'processing' ? 'En cours' :
                     selectedBooking.payment_status === 'held' ? 'Retenu' :
                     selectedBooking.payment_status === 'failed' ? 'Échoué' : 'En attente'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Fermer
              </button>
              {selectedBooking.status === 'pending' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedBooking.id, 'confirmed');
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}