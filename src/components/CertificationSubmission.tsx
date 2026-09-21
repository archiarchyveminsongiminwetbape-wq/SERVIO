import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { certificationsApi } from '@/lib/api/api';
import { Shield, Upload, CheckCircle, XCircle, Clock, FileText, AlertCircle, User, Phone, Mail, MapPin, Building } from 'lucide-react';

interface Certification {
  id: string;
  certification_type: string;
  status: string;
  submitted_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  evidence_data: any;
}

export default function CertificationSubmission({ userId }: { userId: string }) {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [evidenceData, setEvidenceData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const certificationTypes = [
    { value: 'identity', label: 'Pièce d\'identité', icon: User, description: 'Carte d\'identité, passeport, etc.' },
    { value: 'phone', label: 'Numéro de téléphone', icon: Phone, description: 'Vérification du numéro de téléphone' },
    { value: 'email', label: 'Adresse email', icon: Mail, description: 'Vérification de l\'adresse email' },
    { value: 'address', label: 'Adresse physique', icon: MapPin, description: 'Justificatif de domicile' },
    { value: 'business', label: 'Documents business', icon: Building, description: 'Registre de commerce, etc.' },
    { value: 'provider', label: 'Certification prestataire', icon: Shield, description: 'Diplômes, certifications professionnelles' }
  ];

  useEffect(() => {
    loadCertifications();
  }, [userId]);

  const loadCertifications = async () => {
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
        userId,
        selectedType,
        evidenceData
      );

      if (result.success) {
        setSuccess('Certification soumise avec succès!');
        setShowForm(false);
        setSelectedType('');
        setEvidenceData({});
        await loadCertifications();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Chargement des certifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Certifications de Compte</h2>
          <p className="text-gray-600">Augmentez votre niveau de confiance en certifiant votre compte</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Upload className="w-4 h-4" />
          Soumettre une certification
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

      {showForm && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Soumettre une certification</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Type de certification</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Sélectionnez un type...</option>
              {certificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {selectedType && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getCertificationIcon(selectedType)}
                  <span className="font-medium">
                    {certificationTypes.find(t => t.value === selectedType)?.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {certificationTypes.find(t => t.value === selectedType)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Documents/Informations</label>
                <textarea
                  value={JSON.stringify(evidenceData, null, 2)}
                  onChange={(e) => {
                    try {
                      setEvidenceData(JSON.parse(e.target.value));
                    } catch {
                      // Allow invalid JSON while typing
                    }
                  }}
                  className="w-full p-2 border rounded-lg font-mono text-sm"
                  rows={6}
                  placeholder='{"document_type": "carte_identite", "document_number": "123456789", "document_url": "https://..."}'
                />
                <p className="text-xs text-gray-500 mt-1">
                  Entrez les données au format JSON. Ex: document_type, document_number, document_url, etc.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Soumission en cours...' : 'Soumettre'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedType('');
                    setEvidenceData({});
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {certifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Aucune certification soumise</p>
            <p className="text-sm text-gray-500">Soumettez vos certifications pour augmenter votre confiance</p>
          </div>
        ) : (
          certifications.map((cert) => (
            <div key={cert.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  {getStatusIcon(cert.status)}
                  <div>
                    <div className="flex items-center gap-2">
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
                    </div>
                    <p className="text-sm text-gray-600">
                      Soumis le: {cert.submitted_at ? new Date(cert.submitted_at).toLocaleDateString('fr-FR') : '-'}
                    </p>
                    {cert.reviewed_at && (
                      <p className="text-xs text-gray-500">
                        Reviewé le: {new Date(cert.reviewed_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {cert.rejection_reason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Raison du rejet:</strong> {cert.rejection_reason}
                </div>
              )}

              {cert.evidence_data && Object.keys(cert.evidence_data).length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium mb-1">Données soumises:</p>
                  <pre className="text-xs overflow-auto max-h-32">
                    {JSON.stringify(cert.evidence_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium mb-2">Niveaux de certification</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>None (0-24 points)</span>
            <span className="text-gray-600">Compte non certifié</span>
          </div>
          <div className="flex justify-between">
            <span>Basic (25-49 points)</span>
            <span className="text-blue-600">Certification de base</span>
          </div>
          <div className="flex justify-between">
            <span>Standard (50-69 points)</span>
            <span className="text-green-600">Compte certifié ✓</span>
          </div>
          <div className="flex justify-between">
            <span>Verified (70-89 points)</span>
            <span className="text-green-700">Compte vérifié</span>
          </div>
          <div className="flex justify-between">
            <span>Premium (90-100 points)</span>
            <span className="text-green-800">Compte premium</span>
          </div>
        </div>
      </div>
    </div>
  );
}
