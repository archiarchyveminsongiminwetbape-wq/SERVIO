import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, MapPin, Clock, DollarSign, CheckCircle, 
  XCircle, Loader2, Star, Filter, Search, ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { formatDate } from '@/lib/utils';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

interface Booking {
  id: string;
  client_id: string;
  provider_id: string;
  service_type: string;
  scheduled_at: string;
  duration_minutes: number;
  location_type: string;
  location_address: string | null;
  notes: string | null;
  status: BookingStatus;
  price: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  confirmed: { label: 'Confirmé', color: 'bg-primary-100 text-primary-700', icon: CheckCircle },
  completed: { label: 'Complété', color: 'bg-success-100 text-success-700', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-error-100 text-error-700', icon: XCircle },
  no_show: { label: 'Absent', color: 'bg-neutral-100 text-neutral-700', icon: XCircle },
};

export default function ProviderProjectsPage() {
  const { slug } = useParams();
  const { user, profile } = useAuth();
  const { t, locale } = useI18n();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [slug, statusFilter, yearFilter, searchQuery]);

  async function loadBookings() {
    if (!slug) return;
    setLoading(true);

    try {
      // First get the provider ID from the slug
      const { data: providerData } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (!providerData) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('bookings')
        .select('id, client_id, provider_id, service_type, scheduled_at, duration_minutes, location_type, location_address, notes, status, price, currency, created_at, updated_at, client:profiles(id, full_name, avatar_url)')
        .eq('provider_id', providerData.id);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (yearFilter !== 'all') {
        const startDate = new Date(parseInt(yearFilter), 0, 1).toISOString();
        const endDate = new Date(parseInt(yearFilter) + 1, 0, 1).toISOString();
        query = query.gte('scheduled_at', startDate).lt('scheduled_at', endDate);
      }

      const { data } = await query.order('scheduled_at', { ascending: false });
      
      let filteredData = data as Booking[] ?? [];
      
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        filteredData = filteredData.filter(booking =>
          booking.service_type.toLowerCase().includes(queryLower) ||
          booking.client?.full_name?.toLowerCase().includes(queryLower) ||
					booking.notes?.toLowerCase().includes(queryLower)
        );
      }

      setBookings(filteredData);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  const years = Array.from(new Set(
    bookings.map(b => new Date(b.scheduled_at).getFullYear())
  )).sort((a, b) => b - a);

  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.price || 0), 0);

  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

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
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Historique des projets</h1>
          <p className="text-neutral-600">Tous les projets et missions réalisés</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success-100 text-success-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Projets complétés</p>
                <p className="text-2xl font-bold text-neutral-900">{completedCount}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-error-100 text-error-600">
                <XCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Annulations</p>
                <p className="text-2xl font-bold text-neutral-900">{cancelledCount}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary-100 text-primary-600">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Revenus totaux</p>
                <p className="text-2xl font-bold text-neutral-900">{totalRevenue.toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
            >
              <Filter size={18} />
              Filtres
              <ChevronDown size={16} className={showFilters ? 'rotate-180' : ''} />
            </button>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 py-2 text-sm w-64"
              />
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
                  className="input-field"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="completed">Complété</option>
                  <option value="cancelled">Annulé</option>
                  <option value="no_show">Absent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Année</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">Toutes les années</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="card p-12 text-center">
            <CheckCircle size={64} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Aucun projet</h3>
            <p className="text-neutral-600">
              {statusFilter !== 'all' || yearFilter !== 'all' || searchQuery
                ? 'Aucun projet ne correspond à vos filtres.'
                : 'Ce prestataire n\'a pas encore de projets enregistrés.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const config = statusConfig[booking.status];
              const StatusIcon = config.icon;
              return (
                <div key={booking.id} className="card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-neutral-900">{booking.service_type}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon size={12} />
                          {config.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(booking.scheduled_at, locale)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {booking.duration_minutes} min
                        </span>
                        {booking.price && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={14} />
                            {booking.price.toFixed(2)} {booking.currency}
                          </span>
                        )}
                      </div>

                      {booking.client && (
                        <div className="flex items-center gap-3 mb-3">
                          {booking.client.avatar_url ? (
                            <img src={booking.client.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-600">
                              {booking.client.full_name?.[0]?.toUpperCase() ?? 'C'}
                            </div>
                          )}
                          <span className="text-sm text-neutral-700">{booking.client.full_name || 'Client anonyme'}</span>
                        </div>
                      )}

                      {booking.location_address && (
                        <div className="flex items-center gap-1 text-sm text-neutral-600">
                          <MapPin size={14} />
                          {booking.location_address}
                        </div>
                      )}

                      {booking.notes && (
                        <p className="mt-3 text-sm text-neutral-600 italic">{booking.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
