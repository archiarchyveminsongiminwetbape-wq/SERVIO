import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Send, CheckCircle, XCircle, Clock, 
  Loader2, Search, Filter, DollarSign, Calendar, Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import type { Quote } from '@/types';
import { formatDate } from '@/lib/utils';

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

const statusConfig: Record<QuoteStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  draft: { label: 'Brouillon', color: 'bg-neutral-100 text-neutral-700', icon: FileText },
  sent: { label: 'Envoyé', color: 'bg-primary-100 text-primary-700', icon: Send },
  accepted: { label: 'Accepté', color: 'bg-success-100 text-success-700', icon: CheckCircle },
  rejected: { label: 'Refusé', color: 'bg-error-100 text-error-700', icon: XCircle },
  expired: { label: 'Expiré', color: 'bg-amber-100 text-amber-700', icon: Clock },
};

export default function QuotesPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t, locale } = useI18n();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, [statusFilter, searchQuery]);

  async function loadQuotes() {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from('quotes')
        .select('*')
        .eq('provider_id', profile?.provider_profile_id || '');

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data } = await query.order('created_at', { ascending: false });
      
      let filteredData = data as Quote[] ?? [];
      
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        filteredData = filteredData.filter(quote =>
          quote.project_title.toLowerCase().includes(queryLower) ||
          quote.client_name?.toLowerCase().includes(queryLower) ||
          quote.service_type.toLowerCase().includes(queryLower)
        );
      }

      setQuotes(filteredData);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendQuote(quoteId: string) {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', quoteId);

      if (error) throw error;
      loadQuotes();
    } catch (error) {
      console.error('Error sending quote:', error);
    }
  }

  async function handleDeleteQuote(quoteId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) return;

    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;
      loadQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  }

  const totalValue = quotes
    .filter(q => q.status === 'accepted')
    .reduce((sum, q) => sum + (q.estimated_total || 0), 0);

  const pendingCount = quotes.filter(q => q.status === 'sent').length;
  const acceptedCount = quotes.filter(q => q.status === 'accepted').length;

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Devis & Estimations</h1>
            <p className="text-neutral-600">Gérez vos devis et estimations clients</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nouveau devis
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary-100 text-primary-600">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Devis en attente</p>
                <p className="text-2xl font-bold text-neutral-900">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success-100 text-success-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Devis acceptés</p>
                <p className="text-2xl font-bold text-neutral-900">{acceptedCount}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent-100 text-accent-600">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Valeur totale acceptée</p>
                <p className="text-2xl font-bold text-neutral-900">{totalValue.toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 py-2 text-sm w-full"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | 'all')}
              className="input-field py-2 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillons</option>
              <option value="sent">Envoyés</option>
              <option value="accepted">Acceptés</option>
              <option value="rejected">Refusés</option>
              <option value="expired">Expirés</option>
            </select>
          </div>
        </div>

        {/* Quotes List */}
        {quotes.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText size={64} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Aucun devis</h3>
            <p className="text-neutral-600 mb-4">
              {statusFilter !== 'all' || searchQuery
                ? 'Aucun devis ne correspond à vos filtres.'
                : 'Commencez par créer votre premier devis.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Créer un devis
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => {
              const config = statusConfig[quote.status];
              const StatusIcon = config.icon;
              return (
                <div key={quote.id} className="card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-neutral-900">{quote.project_title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon size={12} />
                          {config.label}
                        </span>
                      </div>
                      
                      <p className="text-sm text-neutral-600 mb-3">{quote.service_type}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
                        {quote.client_name && (
                          <span className="flex items-center gap-1">
                            <Eye size={14} />
                            {quote.client_name}
                          </span>
                        )}
                        {quote.estimated_total && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={14} />
                            {quote.estimated_total.toFixed(2)} {quote.currency}
                          </span>
                        )}
                        {quote.valid_until && (
                          <span className={`flex items-center gap-1 ${
                            new Date(quote.valid_until) < new Date() ? 'text-error-600' : ''
                          }`}>
                            <Calendar size={14} />
                            Valide jusqu'au {formatDate(quote.valid_until, locale)}
                          </span>
                        )}
                      </div>

                      {quote.project_description && (
                        <p className="text-sm text-neutral-600 line-clamp-2">{quote.project_description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {quote.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleSendQuote(quote.id)}
                            className="btn-primary text-sm py-2"
                          >
                            <Send size={16} className="mr-1" />
                            Envoyer
                          </button>
                          <button
                            onClick={() => handleDeleteQuote(quote.id)}
                            className="btn-ghost text-error-600 hover:bg-error-50 text-sm py-2"
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => navigate(`/quotes/${quote.id}`)}
                        className="btn-secondary text-sm py-2"
                      >
                        Voir détails
                      </button>
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
