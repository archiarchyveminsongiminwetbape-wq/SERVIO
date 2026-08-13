import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Users, FolderOpen, Flag, BarChart3, Loader2,
  CheckCircle2, XCircle, Clock, AlertCircle, Eye, Ban,
  Search, Check, FileText, TrendingUp, Plus, Trash2, Edit3, Save, X, PanelLeftClose
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import type { ProviderProfile, Profile, Report, Category, AdminAction } from '@/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import CategoryIcon from '@/components/CategoryIcon';

type Tab = 'stats' | 'validation' | 'users' | 'reports' | 'categories' | 'audit';

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('stats');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [pendingProviders, setPendingProviders] = useState<ProviderProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allProviders, setAllProviders] = useState<ProviderProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAction[]>([]);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', icon: '', description: '', parent_id: '' });
  const [stats, setStats] = useState({ users: 0, providers: 0, pending: 0, approved: 0, reports: 0, messages: 0 });
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [validationNote, setValidationNote] = useState('');
  const [validationFilter, setValidationFilter] = useState<'all' | 'pending' | 'changes_requested'>('all');
  const [bulkAction, setBulkAction] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [showPortfolioPreview, setShowPortfolioPreview] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (profile && profile.role !== 'admin') {
        navigate('/');
      }
    }
  }, [authLoading, user, profile, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadAllData();
    }
  }, [user, profile]);

  async function loadAllData() {
    setLoading(true);
    const [pendingRes, profilesRes, providersRes, reportsRes, statsRes, catRes, auditRes] = await Promise.all([
      supabase.from('provider_profiles').select('*, category:categories(*)').eq('validation_status', 'pending').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('provider_profiles').select('*, category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.rpc('get_admin_stats'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('admin_actions').select('*, admin:profiles!admin_actions_admin_id_fkey(full_name, email)').order('created_at', { ascending: false }).limit(50),
    ]);

    setPendingProviders(pendingRes.data as ProviderProfile[] ?? []);
    setAllProfiles(profilesRes.data as Profile[] ?? []);
    setAllProviders(providersRes.data as ProviderProfile[] ?? []);
    setReports(reportsRes.data as Report[] ?? []);
    setCategories(catRes.data as Category[] ?? []);
    setAuditLogs(auditRes.data as AdminAction[] ?? []);
    if (statsRes.data) {
      setStats(statsRes.data as typeof stats);
    }
    setLoading(false);
  }

  async function logAdminAction(actionType: string, targetType: string, targetId: string, details: string) {
    if (!user) return;
    await supabase.from('admin_actions').insert({
      admin_id: user.id,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  }

  async function validateProvider(status: 'approved' | 'rejected' | 'changes_requested') {
    if (!selectedProvider || !user) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('provider_profiles')
      .update({
        validation_status: status,
        validation_note: validationNote || null,
        validated_at: new Date().toISOString(),
        validated_by: user.id,
        badges: status === 'approved'
          ? Array.from(new Set([...selectedProvider.badges, 'profil-verifie']))
          : selectedProvider.badges,
      })
      .eq('id', selectedProvider.id);

    if (!error) {
      await logAdminAction('validate_provider', 'provider_profile', selectedProvider.id, `Status: ${status}. Note: ${validationNote}`);

      // Send notification to the provider
      const notifTitle = status === 'approved' ? 'Profil validé' : status === 'rejected' ? 'Profil refusé' : 'Modifications demandées';
      const notifBody = status === 'approved'
        ? 'Votre profil a été validé et est maintenant visible publiquement.'
        : status === 'rejected'
        ? 'Votre profil a été refusé.' + (validationNote ? ` Motif: ${validationNote}` : '')
        : 'Des modifications sont nécessaires sur votre profil.' + (validationNote ? ` Note: ${validationNote}` : '');
      await supabase.from('notifications').insert({
        user_id: selectedProvider.user_id,
        type: 'validation',
        title: notifTitle,
        body: notifBody,
        link: '/provider/dashboard',
      });

      setSelectedProvider(null);
      setValidationNote('');
      await loadAllData();
    }
    setActionLoading(false);
  }

  async function bulkValidateProviders(status: 'approved' | 'rejected' | 'changes_requested') {
    if (!user || selectedProviders.size === 0) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('provider_profiles')
      .update({
        validation_status: status,
        validated_at: new Date().toISOString(),
        validated_by: user.id,
      })
      .in('id', Array.from(selectedProviders));

    if (!error) {
      await logAdminAction('bulk_validate_providers', 'provider_profile', '', `Status: ${status}. Count: ${selectedProviders.size}`);
      setSelectedProviders(new Set());
      setBulkAction('');
      await loadAllData();
    }
    setActionLoading(false);
  }

  const toggleProviderSelection = (providerId: string) => {
    setSelectedProviders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }
      return newSet;
    });
  };

  const getFilteredProviders = () => {
    if (validationFilter === 'all') return pendingProviders;
    return pendingProviders.filter(p => p.validation_status === validationFilter);
  };

  async function updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned') {
    setActionLoading(true);
    const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
    if (!error) {
      await logAdminAction('update_user_status', 'profile', userId, `Status: ${status}`);
      await loadAllData();
    }
    setActionLoading(false);
  }

  async function updateReportStatus(reportId: string, status: 'resolved' | 'dismissed') {
    if (!user) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('reports')
      .update({
        status,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', reportId);
    if (!error) {
      await logAdminAction('resolve_report', 'report', reportId, `Status: ${status}`);
      await loadAllData();
    }
    setActionLoading(false);
  }

  async function saveCategory() {
    setActionLoading(true);
    const slug = catForm.slug || catForm.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (editingCat) {
      await supabase.from('categories').update({
        name: catForm.name,
        slug,
        icon: catForm.icon || null,
        description: catForm.description || null,
      }).eq('id', editingCat.id);
      await logAdminAction('update_category', 'category', editingCat.id, `Name: ${catForm.name}`);
    } else {
      const maxSort = categories.length;
      await supabase.from('categories').insert({
        name: catForm.name,
        slug,
        icon: catForm.icon || null,
        description: catForm.description || null,
        parent_id: catForm.parent_id || null,
        sort_order: maxSort,
      });
      await logAdminAction('create_category', 'category', '', `Name: ${catForm.name}`);
    }

    setShowCatForm(false);
    setEditingCat(null);
    setCatForm({ name: '', slug: '', icon: '', description: '', parent_id: '' });
    await loadAllData();
    setActionLoading(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm(`${t.admin.deleteCategoryConfirm} ${t.admin.deleteCategorySubtext}`)) return;
    setActionLoading(true);
    await supabase.from('categories').delete().eq('id', id);
    await logAdminAction('delete_category', 'category', id, '');
    await loadAllData();
    setActionLoading(false);
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  const filteredProfiles = allProfiles.filter((p) =>
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: typeof Shield; badge?: number }[] = [
    { id: 'stats', label: t.admin.stats, icon: BarChart3 },
    { id: 'validation', label: t.admin.validation, icon: CheckCircle2, badge: pendingProviders.length },
    { id: 'users', label: t.admin.users, icon: Users },
    { id: 'categories', label: t.admin.categories, icon: FolderOpen },
    { id: 'reports', label: t.admin.reports, icon: Flag, badge: reports.filter((r) => r.status === 'open').length },
    { id: 'audit', label: t.admin.journal, icon: FileText },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{t.admin.dashboard}</h1>
            <p className="text-sm text-neutral-600">Gestion de la plateforme SERVIO</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 sm:gap-2 whitespace-nowrap px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                tab === t.id ? 'border-b-2 border-primary-600 text-primary-600' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Icon size={14} className="sm:hidden" />
              <Icon size={16} className="hidden sm:block" />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="flex h-4 sm:h-5 min-w-4 sm:min-w-5 items-center justify-center rounded-full bg-error-500 px-1 sm:px-1.5 text-[10px] sm:text-xs font-bold text-white">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      {tab === 'stats' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: t.admin.registeredUsers, value: stats.users, icon: Users, color: 'bg-primary-50 text-primary-600' },
            { label: t.admin.activeProviders, value: stats.providers, icon: FolderOpen, color: 'bg-success-50 text-success-600' },
            { label: t.admin.pendingValidation, value: stats.pending, icon: Clock, color: 'bg-accent-50 text-accent-600' },
            { label: t.admin.approvedProfiles, value: stats.approved, icon: CheckCircle2, color: 'bg-success-50 text-success-600' },
            { label: t.admin.openReports, value: stats.reports, icon: Flag, color: 'bg-error-50 text-error-600' },
            { label: t.admin.messagesExchanged, value: stats.messages, icon: TrendingUp, color: 'bg-primary-50 text-primary-600' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`flex h-10 w-10 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${stat.color}`}>
                    <Icon size={18} className="sm:hidden" />
                    <Icon size={26} className="hidden sm:block" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-3xl font-bold text-neutral-900">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-neutral-500 truncate">{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Validation queue */}
      {tab === 'validation' && (
        <div>
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setValidationFilter('all')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  validationFilter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t.admin.all} ({pendingProviders.length})
              </button>
              <button
                onClick={() => setValidationFilter('pending')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  validationFilter === 'pending'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t.admin.pending} ({pendingProviders.filter(p => p.validation_status === 'pending').length})
              </button>
              <button
                onClick={() => setValidationFilter('changes_requested')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  validationFilter === 'changes_requested'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t.admin.correctionsRequested} ({pendingProviders.filter(p => p.validation_status === 'changes_requested').length})
              </button>
            </div>

            {selectedProviders.size > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs sm:text-sm text-neutral-600">{selectedProviders.size} sélectionné(s)</span>
                <select
                  value={bulkAction}
                  onChange={(e) => {
                    setBulkAction(e.target.value);
                    if (e.target.value) {
                      bulkValidateProviders(e.target.value as 'approved' | 'rejected' | 'changes_requested');
                    }
                  }}
                  className="input-field text-xs sm:text-sm"
                >
                  <option value="">{t.admin.bulkAction}</option>
                  <option value="approved">{t.admin.approve}</option>
                  <option value="rejected">{t.admin.reject}</option>
                  <option value="changes_requested">{t.admin.requestCorrections}</option>
                </select>
              </div>
            )}
          </div>

          {getFilteredProviders().length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 size={48} className="text-success-300" />
              <p className="mt-3 text-sm text-neutral-500">{t.admin.noProfilesToValidate}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredProviders().map((prov) => (
                <div key={prov.id} className="card p-5">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedProviders.has(prov.id)}
                      onChange={() => toggleProviderSelection(prov.id)}
                      className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    {prov.avatar_url ? (
                      <img src={prov.avatar_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-lg font-bold text-primary-700">
                        {prov.business_name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-neutral-900">{prov.business_name}</h3>
                        <span className={`badge ${
                          prov.validation_status === 'pending' ? 'bg-warning-50 text-warning-700' :
                          prov.validation_status === 'changes_requested' ? 'bg-accent-50 text-accent-700' :
                          'bg-success-50 text-success-700'
                        }`}>
                          {prov.validation_status === 'pending' ? t.admin.pending :
                           prov.validation_status === 'changes_requested' ? t.admin.correctionsRequested :
                           t.admin.approvedProfiles}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500">{prov.headline}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {prov.category?.name && <span className="badge bg-primary-50 text-primary-700">{prov.category.name}</span>}
                        {prov.city && <span className="badge bg-neutral-100 text-neutral-600">{prov.city}</span>}
                        {prov.skills.slice(0, 3).map((s) => <span key={s} className="badge bg-neutral-100 text-neutral-600">{s}</span>)}
                      </div>
                      {prov.description && (
                        <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{prov.description}</p>
                      )}
                      {prov.validation_note && (
                        <div className="mt-2 rounded-lg bg-accent-50 p-2 text-xs text-accent-700">
                          <span className="font-semibold">Note précédente:</span> {prov.validation_note}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => { setSelectedProvider(prov); setValidationNote(''); }}
                        className="btn-secondary text-sm"
                      >
                        <Eye size={16} />
                        {t.admin.review}
                      </button>
                    </div>
                  </div>

                  {selectedProvider?.id === prov.id && (
                    <div className="mt-4 border-t border-neutral-100 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-semibold text-neutral-500 mb-2">{t.admin.contactInfo}</p>
                          <p className="text-sm text-neutral-700">Email: {prov.contact_email || 'Non renseigné'}</p>
                          <p className="text-sm text-neutral-700">Téléphone: {prov.contact_phone || 'Non renseigné'}</p>
                          <p className="text-sm text-neutral-700">Site web: {prov.website || 'Non renseigné'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-neutral-500 mb-2">{t.admin.pricing}</p>
                          <p className="text-sm text-neutral-700">Gamme: {prov.price_range || 'Non renseigné'}</p>
                          <p className="text-sm text-neutral-700">Min: {prov.price_min ? `${prov.price_min}€` : 'Non renseigné'}</p>
                          <p className="text-sm text-neutral-700">Max: {prov.price_max ? `${prov.price_max}€` : 'Non renseigné'}</p>
                        </div>
                      </div>

                      {prov.description && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-neutral-500">{t.admin.fullDescription}</p>
                          <p className="mt-1 text-sm text-neutral-700">{prov.description}</p>
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="label">{t.admin.validationNote}</label>
                        <textarea
                          value={validationNote}
                          onChange={(e) => setValidationNote(e.target.value)}
                          className="input-field resize-none"
                          rows={2}
                          placeholder={t.admin.validationNotePlaceholder}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => validateProvider('approved')}
                          disabled={actionLoading}
                          className="btn-primary text-sm"
                        >
                          <CheckCircle2 size={16} />
                          {t.admin.validate}
                        </button>
                        <button
                          onClick={() => validateProvider('changes_requested')}
                          disabled={actionLoading}
                          className="btn-secondary text-sm"
                        >
                          <AlertCircle size={16} />
                          {t.admin.requestCorrection}
                        </button>
                        <button
                          onClick={() => validateProvider('rejected')}
                          disabled={actionLoading}
                          className="btn-secondary text-sm text-error-600 hover:bg-error-50"
                        >
                          <XCircle size={16} />
                          {t.admin.reject}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9"
                placeholder={t.admin.searchByNameOrEmail}
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">{t.admin.user}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">{t.admin.role}</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-neutral-600 sm:table-cell">{t.admin.status}</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-neutral-600 sm:table-cell">{t.admin.registration}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-600">
                            {p.full_name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{p.full_name ?? 'N/A'}</p>
                          <p className="text-xs text-neutral-500">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        p.role === 'admin' ? 'bg-primary-50 text-primary-700' :
                        p.role === 'provider' ? 'bg-accent-50 text-accent-700' :
                        'bg-neutral-100 text-neutral-600'
                      }`}>
                        {p.role === 'admin' ? t.admin.adminRole : p.role === 'provider' ? t.admin.providerRole : t.admin.clientRole}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={`badge ${
                        p.status === 'active' ? 'bg-success-50 text-success-700' :
                        p.status === 'suspended' ? 'bg-warning-50 text-warning-700' :
                        'bg-error-50 text-error-700'
                      }`}>
                        {p.status === 'active' ? t.admin.activeStatus : p.status === 'suspended' ? t.admin.suspendedStatus : t.admin.bannedStatus}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-neutral-500 sm:table-cell">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {p.role !== 'admin' && (
                        <select
                          value={p.status}
                          onChange={(e) => updateUserStatus(p.id, e.target.value as 'active' | 'suspended' | 'banned')}
                          disabled={actionLoading}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-700 focus:border-primary-500 focus:outline-none"
                        >
                          <option value="active">{t.admin.activeStatus}</option>
                          <option value="suspended">{t.admin.suspendedStatus}</option>
                          <option value="banned">{t.admin.bannedStatus}</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories management */}
      {tab === 'categories' && (
        <div>
          <div className="mb-4 flex justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">{t.admin.categories} ({categories.length})</h3>
            <button
              onClick={() => {
                setEditingCat(null);
                setCatForm({ name: '', slug: '', icon: '', description: '', parent_id: '' });
                setShowCatForm(true);
              }}
              className="btn-primary"
            >
              <Plus size={18} />
              {t.admin.add}
            </button>
          </div>

          {showCatForm && (
            <div className="card mb-6 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold text-neutral-900">{editingCat ? t.admin.edit : t.admin.newCategory}</h4>
                <button onClick={() => setShowCatForm(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">{t.admin.name}</label>
                  <input
                    type="text"
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Plomberie"
                  />
                </div>
                <div>
                  <label className="label">{t.admin.iconName}</label>
                  <input
                    type="text"
                    value={catForm.icon}
                    onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Hammer"
                  />
                </div>
                <div>
                  <label className="label">{t.admin.parentCategory}</label>
                  <select
                    value={catForm.parent_id}
                    onChange={(e) => setCatForm({ ...catForm, parent_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">{t.admin.none} ({t.admin.mainSector})</option>
                    {categories.filter((c) => !c.parent_id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t.admin.description}</label>
                  <input
                    type="text"
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    className="input-field"
                    placeholder={t.admin.shortDescription}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowCatForm(false)} className="btn-secondary">{t.admin.cancel}</button>
                <button onClick={saveCategory} disabled={actionLoading || !catForm.name} className="btn-primary">
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {t.admin.save}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {categories.filter((c) => !c.parent_id).map((parent) => (
              <div key={parent.id} className="card overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <CategoryIcon name={parent.icon ?? ''} size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">{parent.name}</p>
                      <p className="text-xs text-neutral-500">{parent.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      {categories.filter((c) => c.parent_id === parent.id).length} {t.admin.subcategories}
                    </span>
                    <button
                      onClick={() => {
                        setEditingCat(parent);
                        setCatForm({ name: parent.name, slug: parent.slug, icon: parent.icon ?? '', description: parent.description ?? '', parent_id: '' });
                        setShowCatForm(true);
                      }}
                      className="btn-ghost text-sm"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteCategory(parent.id)}
                      disabled={actionLoading}
                      className="btn-ghost text-sm text-error-600 hover:bg-error-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {categories.filter((c) => c.parent_id === parent.id).length > 0 && (
                  <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      {categories.filter((c) => c.parent_id === parent.id).map((sub) => (
                        <span key={sub.id} className="badge bg-white text-neutral-600 border border-neutral-200">
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div>
          {reports.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Flag size={48} className="text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">Aucun signalement</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${
                          report.report_type === 'profile' ? 'bg-primary-50 text-primary-700' :
                          report.report_type === 'review' ? 'bg-accent-50 text-accent-700' :
                          'bg-error-50 text-error-700'
                        }`}>
                          {report.report_type}
                        </span>
                        <span className={`badge ${
                          report.status === 'open' ? 'bg-error-50 text-error-700' :
                          report.status === 'resolved' ? 'bg-success-50 text-success-700' :
                          'bg-neutral-100 text-neutral-600'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-neutral-600">{report.reason}</p>
                      <p className="mt-1 text-xs text-neutral-400">{formatRelativeTime(report.created_at)}</p>
                    </div>
                    {report.status === 'open' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateReportStatus(report.id, 'resolved')}
                          disabled={actionLoading}
                          className="btn-primary text-sm"
                        >
                          <Check size={16} />
                          Résoudre
                        </button>
                        <button
                          onClick={() => updateReportStatus(report.id, 'dismissed')}
                          disabled={actionLoading}
                          className="btn-secondary text-sm"
                        >
                          Ignorer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit log */}
      {tab === 'audit' && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-neutral-900">Journal d'actions ({auditLogs.length})</h3>
          {auditLogs.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <FileText size={48} className="text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">Aucune action enregistrée</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">Admin</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">Action</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold text-neutral-600 sm:table-cell">Cible</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold text-neutral-600 sm:table-cell">Détails</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-sm text-neutral-700">
                        {log.admin?.full_name ?? log.admin_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-primary-50 text-primary-700">{log.action_type}</span>
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-neutral-500 sm:table-cell">{log.target_type ?? '-'}</td>
                      <td className="hidden max-w-xs px-4 py-3 text-sm text-neutral-500 sm:table-cell truncate">{log.details ?? '-'}</td>
                      <td className="px-4 py-3 text-xs text-neutral-400">{formatRelativeTime(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
