import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { certificationsApi } from '@/lib/api/api';
import { 
  Shield, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  AlertCircle, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building,
  Camera,
  FileImage,
  X,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Award,
  Star
} from 'lucide-react';

interface Certification {
  id: string;
  user_id: string;
  certification_type: string;
  status: string;
  submitted_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  evidence_data: any;
  expiry_date?: string;
  is_verified?: boolean;
  verification_score?: number;
  profiles?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_certified: boolean;
  certification_level: string;
  certification_date?: string;
}

export default function AccountCertificationManager({ userId, isAdmin = false }: { userId?: string; isAdmin?: boolean }) {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [evidenceData, setEvidenceData] = useState<any>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const certificationTypes = [
    { 
      value: 'identity', 
      label: 'Pièce d\'identité', 
      icon: User, 
      description: 'Carte d\'identité, passeport, permis de conduire',
      requiredFields: ['document_type', 'document_number', 'document_url', 'expiry_date'],
      points: 25
    },
    { 
      value: 'phone', 
      label: 'Numéro de téléphone', 
      icon: Phone, 
      description: 'Vérification du numéro de téléphone via SMS',
      requiredFields: ['phone_number', 'verification_code'],
      points: 15
    },
    { 
      value: 'email', 
      label: 'Adresse email', 
      icon: Mail, 
      description: 'Vérification de l\'adresse email',
      requiredFields: ['email_address'],
      points: 10
    },
    { 
      value: 'address', 
      label: 'Adresse physique', 
      icon: MapPin, 
      description: 'Justificatif de domicile (facture, quittance)',
      requiredFields: ['address', 'city', 'country', 'document_url'],
      points: 20
    },
    { 
      value: 'business', 
      label: 'Documents business', 
      icon: Building, 
      description: 'Registre de commerce, documents fiscaux',
      requiredFields: ['business_name', 'registration_number', 'tax_id', 'document_url'],
      points: 20
    },
    { 
      value: 'provider', 
      label: 'Certification prestataire', 
      icon: Shield, 
      description: 'Diplômes, certifications professionnelles, portfolios',
      requiredFields: ['certification_name', 'issuing_organization', 'certificate_url'],
      points: 10
    }
  ];

  useEffect(() => {
    if (userId) {
      loadCertifications();
      loadUserProfile();
    } else if (isAdmin) {
      loadAllCertifications();
    }
  }, [userId, isAdmin]);

  const loadCertifications = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const result = await certificationsApi.getUserCertifications(userId);
      if (result.success) {
        setCertifications(result.data || []);
      }
    } catch (error) {
      console.error('Error loading certifications:', error);
      setError('Erreur lors du chargement des certifications');
    } finally {
      setLoading(false);
    }
  };

  const loadAllCertifications = async () => {
    try {
      setLoading(true);
      const result = await certificationsApi.getPendingCertifications();
      if (result.success) {
        setCertifications(result.data || []);
      }
    } catch (error) {
      console.error('Error loading certifications:', error);
      setError('Erreur lors du chargement des certifications');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_certified, certification_level, certification_date')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files to Supabase storage
    for (const file of newFiles) {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('certifications')
          .upload(fileName, file);

        if (error) throw error;

        if (data?.path) {
          const { data: { publicUrl } } = supabase.storage
            .from('certifications')
            .getPublicUrl(data.path);

          setEvidenceData(prev => ({
            ...prev,
            documents: [...(prev.documents || []), publicUrl]
          }));
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setError('Erreur lors de l\'upload du fichier');
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      setError('Veuillez sélectionner un type de certification');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const result = await certificationsApi.submitCertification(
        userId || '',
        selectedType,
        {
          ...evidenceData,
          uploaded_files: uploadedFiles.map(f => f.name)
        }
      );

      if (result.success) {
        setSuccess('Certification soumise avec succès!');
        setShowForm(false);
        setSelectedType('');
        setEvidenceData({});
        setUploadedFiles([]);
        await loadCertifications();
        await loadUserProfile();
      } else {
        setError(result.error || 'Erreur lors de la soumission');
      }
    } catch (error) {
      console.error('Error submitting certification:', error);
      setError('Erreur lors de la soumission de la certification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminApproval = async (certificationId: string, approved: boolean, reason?: string) => {
    try {
      const result = approved 
        ? await certificationsApi.approveCertification(certificationId, userId || '')
        : await certificationsApi.rejectCertification(certificationId, userId || '', reason || '');

      if (result.success) {
        setSuccess(approved ? 'Certification approuvée!' : 'Certification rejetée');
        setShowDetailModal(false);
        await loadAllCertifications();
      } else {
        setError(result.error || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Error approving certification:', error);
      setError('Erreur lors de la validation');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'submitted':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'under_review':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'submitted':
        return 'Soumis';
      case 'under_review':
        return 'En cours de review';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      default:
        return status;
    }
  };

  const getCertificationIcon = (type: string) => {
    const certType = certificationTypes.find(t => t.value === type);
    if (certType) {
      const Icon = certType.icon;
      return <Icon className="w-5 h-5" />;
    }
    return <Shield className="w-5 h-5" />;
  };

  const getCertificationLevelBadge = (level: string) => {
    const levels = {
      none: { color: 'bg-gray-100 text-gray-800', label: 'Non certifié' },
      basic: { color: 'bg-blue-100 text-blue-800', label: 'Basic' },
      standard: { color: 'bg-green-100 text-green-800', label: 'Standard' },
      verified: { color: 'bg-emerald-100 text-emerald-800', label: 'Vérifié' },
      premium: { color: 'bg-purple-100 text-purple-800', label: 'Premium' }
    };
    const levelInfo = levels[level as keyof typeof levels] || levels.none;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${levelInfo.color}`}>
        {levelInfo.label}
      </span>
    );
  };

  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = 
      cert.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certification_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p>Chargement des certifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Certifications de Compte</h2>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Gérez les certifications des utilisateurs' 
              : 'Augmentez votre niveau de confiance en certifiant votre compte'}
          </p>
        </div>
        
        {!isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Soumettre une certification
          </button>
        )}
      </div>

      {/* User Profile Summary */}
      {userProfile && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Statut de certification</h3>
            {getCertificationLevelBadge(userProfile.certification_level)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                userProfile.is_certified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <p className="font-semibold">
                  {userProfile.is_certified ? 'Certifié' : 'Non certifié'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Niveau</p>
                <p className="font-semibold capitalize">{userProfile.certification_level}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Date certification</p>
                <p className="font-semibold">
                  {userProfile.certification_date 
                    ? new Date(userProfile.certification_date).toLocaleDateString('fr-FR')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
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

      {/* Admin Filters */}
      {isAdmin && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou type..."
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
              <option value="submitted">Soumis</option>
              <option value="under_review">En cours de review</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Rejetés</option>
            </select>
          </div>
        </div>
      )}

      {/* Certification Form */}
      {showForm && !isAdmin && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Soumettre une certification</h3>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedType('');
                setEvidenceData({});
                setUploadedFiles([]);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type de certification</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Sélectionnez un type...</option>
                {certificationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} (+{type.points} points)
                  </option>
                ))}
              </select>
            </div>

            {selectedType && (
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getCertificationIcon(selectedType)}
                    <span className="font-medium">
                      {certificationTypes.find(t => t.value === selectedType)?.label}
                    </span>
                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                      +{certificationTypes.find(t => t.value === selectedType)?.points} points
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {certificationTypes.find(t => t.value === selectedType)?.description}
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Documents</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                      accept="image/*,.pdf"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Cliquez pour uploader ou glissez-déposez vos documents
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Images (JPG, PNG) ou PDF
                      </p>
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <FileImage className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Fields based on certification type */}
                {selectedType === 'identity' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Type de document</label>
                      <select
                        value={evidenceData.document_type || ''}
                        onChange={(e) => setEvidenceData({...evidenceData, document_type: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="">Sélectionnez...</option>
                        <option value="carte_identite">Carte d'identité</option>
                        <option value="passeport">Passeport</option>
                        <option value="permis_conduire">Permis de conduire</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Numéro de document</label>
                      <input
                        type="text"
                        value={evidenceData.document_number || ''}
                        onChange={(e) => setEvidenceData({...evidenceData, document_number: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Date d'expiration</label>
                      <input
                        type="date"
                        value={evidenceData.expiry_date || ''}
                        onChange={(e) => setEvidenceData({...evidenceData, expiry_date: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {selectedType === 'phone' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Numéro de téléphone</label>
                    <input
                      type="tel"
                      value={evidenceData.phone_number || ''}
                      onChange={(e) => setEvidenceData({...evidenceData, phone_number: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                )}

                {selectedType === 'address' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Adresse</label>
                      <input
                        type="text"
                        value={evidenceData.address || ''}
                        onChange={(e) => setEvidenceData({...evidenceData, address: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="123 Rue Example"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Ville</label>
                        <input
                          type="text"
                          value={evidenceData.city || ''}
                          onChange={(e) => setEvidenceData({...evidenceData, city: e.target.value})}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Pays</label>
                        <input
                          type="text"
                          value={evidenceData.country || ''}
                          onChange={(e) => setEvidenceData({...evidenceData, country: e.target.value})}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Soumission en cours...' : 'Soumettre'}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setSelectedType('');
                      setEvidenceData({});
                      setUploadedFiles([]);
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certifications List */}
      <div className="space-y-4">
        {filteredCertifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Aucune certification trouvée</p>
            <p className="text-sm text-gray-500">
              {isAdmin 
                ? 'Aucune certification en attente de validation' 
                : 'Soumettez vos certifications pour augmenter votre confiance'}
            </p>
          </div>
        ) : (
          filteredCertifications.map((cert) => (
            <div key={cert.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  {getStatusIcon(cert.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold capitalize">
                        {cert.certification_type.replace('_', ' ')}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        cert.status === 'approved' ? 'bg-green-100 text-green-800' :
                        cert.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        cert.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusText(cert.status)}
                      </span>
                      {cert.verification_score && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          {cert.verification_score} points
                        </span>
                      )}
                    </div>
                    
                    {cert.profiles && (
                      <p className="text-sm text-gray-600 mt-1">
                        {cert.profiles.full_name} ({cert.profiles.email})
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Soumis: {cert.submitted_at ? new Date(cert.submitted_at).toLocaleDateString('fr-FR') : '-'}
                      </span>
                      {cert.reviewed_at && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Reviewé: {new Date(cert.reviewed_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedCertification(cert);
                    setShowDetailModal(true);
                  }}
                  className="text-orange-600 hover:text-orange-900 font-medium text-sm"
                >
                  Voir détails
                </button>
              </div>

              {cert.rejection_reason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Raison du rejet:</strong> {cert.rejection_reason}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Certification Levels Info */}
      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Niveaux de certification
          </h4>
          <div className="space-y-2 text-sm">
            {[
              { range: '0-24', level: 'None', description: 'Compte non certifié', color: 'text-gray-600' },
              { range: '25-49', level: 'Basic', description: 'Certification de base', color: 'text-blue-600' },
              { range: '50-69', level: 'Standard', description: 'Compte certifié ✓', color: 'text-green-600' },
              { range: '70-89', level: 'Verified', description: 'Compte vérifié', color: 'text-emerald-600' },
              { range: '90-100', level: 'Premium', description: 'Compte premium', color: 'text-purple-600' },
            ].map((level) => (
              <div key={level.level} className="flex justify-between items-center">
                <span className="text-gray-600">{level.level} ({level.range} points)</span>
                <span className={level.color}>{level.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCertification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Détails de la certification</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                {getCertificationIcon(selectedCertification.certification_type)}
                <div>
                  <h4 className="font-semibold capitalize">
                    {selectedCertification.certification_type.replace('_', ' ')}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedCertification.status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedCertification.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusText(selectedCertification.status)}
                  </span>
                </div>
              </div>

              {selectedCertification.profiles && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Utilisateur</p>
                  <p className="text-sm">{selectedCertification.profiles.full_name}</p>
                  <p className="text-sm text-gray-600">{selectedCertification.profiles.email}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Soumis le</p>
                  <p className="font-semibold">
                    {selectedCertification.submitted_at 
                      ? new Date(selectedCertification.submitted_at).toLocaleString('fr-FR')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reviewé le</p>
                  <p className="font-semibold">
                    {selectedCertification.reviewed_at 
                      ? new Date(selectedCertification.reviewed_at).toLocaleString('fr-FR')
                      : 'N/A'}
                  </p>
                </div>
                {selectedCertification.verification_score && (
                  <div>
                    <p className="text-sm text-gray-600">Score de vérification</p>
                    <p className="font-semibold">{selectedCertification.verification_score}/100</p>
                  </div>
                )}
                {selectedCertification.expiry_date && (
                  <div>
                    <p className="text-sm text-gray-600">Date d'expiration</p>
                    <p className="font-semibold">
                      {new Date(selectedCertification.expiry_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>

              {selectedCertification.evidence_data && Object.keys(selectedCertification.evidence_data).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Données soumises</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedCertification.evidence_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedCertification.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800">Raison du rejet</p>
                  <p className="text-sm text-red-700">{selectedCertification.rejection_reason}</p>
                </div>
              )}

              {isAdmin && selectedCertification.status === 'submitted' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleAdminApproval(selectedCertification.id, true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approuver
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Raison du rejet:');
                      if (reason) handleAdminApproval(selectedCertification.id, false, reason);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}