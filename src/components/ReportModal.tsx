import { useState } from 'react';
import { Flag, X, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'provider' | 'portfolio_item' | 'review' | 'message';
  targetId: string;
  targetName?: string;
}

const reportReasons = {
  provider: [
    { id: 'fake_profile', label: 'Profil fictif', icon: AlertTriangle },
    { id: 'inappropriate_content', label: 'Contenu inapproprié', icon: AlertTriangle },
    { id: 'scam', label: 'Tentative d\'arnaque', icon: AlertTriangle },
    { id: 'spam', label: 'Spam', icon: AlertTriangle },
    { id: 'other', label: 'Autre', icon: AlertTriangle },
  ],
  portfolio_item: [
    { id: 'stolen_content', label: 'Contenu volé', icon: AlertTriangle },
    { id: 'inappropriate', label: 'Contenu inapproprié', icon: AlertTriangle },
    { id: 'misleading', label: 'Trompeur', icon: AlertTriangle },
    { id: 'other', label: 'Autre', icon: AlertTriangle },
  ],
  review: [
    { id: 'fake_review', label: 'Avis fictif', icon: AlertTriangle },
    { id: 'harassment', label: 'Harcèlement', icon: AlertTriangle },
    { id: 'inappropriate', label: 'Contenu inapproprié', icon: AlertTriangle },
    { id: 'other', label: 'Autre', icon: AlertTriangle },
  ],
  message: [
    { id: 'harassment', label: 'Harcèlement', icon: AlertTriangle },
    { id: 'spam', label: 'Spam', icon: AlertTriangle },
    { id: 'scam', label: 'Tentative d\'arnaque', icon: AlertTriangle },
    { id: 'inappropriate', label: 'Contenu inapproprié', icon: AlertTriangle },
    { id: 'other', label: 'Autre', icon: AlertTriangle },
  ],
};

function ReportModal({ isOpen, onClose, targetType, targetId, targetName }: ReportModalProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!selectedReason) {
      setError('Veuillez sélectionner une raison');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error: reportError } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason: selectedReason,
        description,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      if (reportError) throw reportError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSelectedReason('');
        setDescription('');
      }, 2000);
    } catch (err) {
      setError('Erreur lors du signalement');
      console.error('Report error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const reasons = reportReasons[targetType] || reportReasons.provider;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-100">
              <Flag className="h-5 w-5 text-error-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Signaler</h3>
              <p className="text-sm text-neutral-600">{targetName || 'Contenu'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="rounded-xl bg-success-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
              <Flag className="h-6 w-6 text-success-600" />
            </div>
            <p className="font-semibold text-success-900">Signalement envoyé</p>
            <p className="mt-1 text-sm text-success-700">
              Nous examinerons ce signalement dans les plus brefs délais.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Raison du signalement
              </label>
              <div className="space-y-2">
                {reasons.map((reason) => {
                  const Icon = reason.icon;
                  return (
                    <button
                      key={reason.id}
                      type="button"
                      onClick={() => setSelectedReason(reason.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        selectedReason === reason.id
                          ? 'border-error-500 bg-error-50 text-error-700'
                          : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{reason.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le problème en détail..."
                rows={4}
                className="input-field resize-none"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary"
                disabled={submitting || !selectedReason}
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportModal;
