import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { escrowApi } from '@/lib/api/api';
import { Upload, CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react';

// Simple Card component
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>{children}</div>
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

// Simple Button component
const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  className = '',
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  variant?: 'primary' | 'outline' | 'destructive';
  className?: string;
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
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

interface Milestone {
  id: string;
  escrow_id: string;
  title: string;
  description: string;
  percentage: number;
  amount: number;
  status: string;
  evidence_urls: string[];
  due_date?: string;
  completed_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

interface EscrowAccount {
  id: string;
  booking_id: string;
  total_amount: number;
  currency: string;
  status: string;
  milestones: Milestone[];
}

export default function MilestoneSubmission({ bookingId, providerId }: { bookingId: string; providerId: string }) {
  const [escrowAccount, setEscrowAccount] = useState<EscrowAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEscrowAccount();
  }, [bookingId]);

  const loadEscrowAccount = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('escrow_accounts')
        .select(`
          *,
          milestones (*)
        `)
        .eq('booking_id', bookingId)
        .single();

      if (error) throw error;
      setEscrowAccount(data);
    } catch (error) {
      console.error('Error loading escrow account:', error);
      setError('Erreur lors du chargement des jalons');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
    });

    if (validFiles.length !== files.length) {
      setError('Certains fichiers ont été ignorés (type ou taille invalide)');
    }

    setEvidenceFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadEvidence = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `milestone-evidence/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Erreur lors de l'upload de ${file.name}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('evidence')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const submitMilestone = async () => {
    if (!selectedMilestone || evidenceFiles.length === 0) {
      setError('Veuillez sélectionner un jalon et ajouter au moins une preuve');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload des fichiers
      const evidenceUrls = await uploadEvidence(evidenceFiles);

      // Soumettre le jalon
      const result = await escrowApi.submitMilestone(
        selectedMilestone.id,
        providerId,
        evidenceUrls,
        notes
      );

      if (result.success) {
        // Reset form
        setSelectedMilestone(null);
        setEvidenceFiles([]);
        setNotes('');
        
        // Reload data
        await loadEscrowAccount();
        
        alert('Jalon soumis avec succès!');
      } else {
        setError(result.error || 'Erreur lors de la soumission');
      }
    } catch (error) {
      console.error('Error submitting milestone:', error);
      setError('Erreur lors de la soumission du jalon');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'completed':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'completed':
        return 'Soumis';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      case 'paid':
        return 'Payé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Chargement des jalons...</p>
        </div>
      </div>
    );
  }

  if (!escrowAccount) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Aucun compte escrow trouvé pour cette réservation</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Jalons de Paiement</CardTitle>
          <p className="text-sm text-gray-600">
            Total: {escrowAccount.total_amount.toLocaleString()} {escrowAccount.currency}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {escrowAccount.milestones?.map((milestone) => (
              <div
                key={milestone.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedMilestone?.id === milestone.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => milestone.status === 'pending' && setSelectedMilestone(milestone)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(milestone.status)}
                    <h3 className="font-semibold">{milestone.title}</h3>
                  </div>
                  <span className="text-sm text-gray-600">
                    {milestone.percentage}% ({milestone.amount.toLocaleString()} {escrowAccount.currency})
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Statut: {getStatusText(milestone.status)}
                  </span>
                  {milestone.due_date && (
                    <span className="text-xs text-gray-500">
                      Échéance: {new Date(milestone.due_date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
                {milestone.rejection_reason && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Raison du rejet:</strong> {milestone.rejection_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedMilestone && (
        <Card>
          <CardHeader>
            <CardTitle>Soumettre: {selectedMilestone.title}</CardTitle>
            <p className="text-sm text-gray-600">
              Montant: {selectedMilestone.amount.toLocaleString()} {escrowAccount.currency}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Preuves de travail (images, documents)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="evidence-upload"
                />
                <label
                  htmlFor="evidence-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Cliquez pour uploader ou glissez-déposez vos fichiers
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Images (JPG, PNG, GIF), PDF, Word (max 10MB par fichier)
                  </p>
                </label>
              </div>

              {evidenceFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Notes supplémentaires (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows={3}
                placeholder="Décrivez le travail accompli..."
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={submitMilestone}
                disabled={uploading || evidenceFiles.length === 0}
                className="flex-1"
              >
                {uploading ? 'Soumission en cours...' : 'Soumettre le jalon'}
              </Button>
              <Button
                onClick={() => {
                  setSelectedMilestone(null);
                  setEvidenceFiles([]);
                  setNotes('');
                  setError(null);
                }}
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
