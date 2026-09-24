import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import CategoryServiceForm from '@/components/CategoryServiceForm';
import { useCategoryData } from '@/hooks/useCategoryData';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

export default function ProviderCategoryEditPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { categoryData, categorySlug, updateData, refreshData } = useCategoryData(provider?.id || '');

  useEffect(() => {
    loadProvider();
  }, [slug]);

  const loadProvider = async () => {
    if (!slug) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('provider_profiles')
        .select('id, user_id, business_name, category_id, categories(slug)')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Provider not found');
        return;
      }

      // Vérifier que l'utilisateur est le propriétaire du profil
      if (data.user_id !== user?.id) {
        setError('You do not have permission to edit this profile');
        return;
      }

      setProvider(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load provider');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: Record<string, any>) => {
    if (!provider?.id || !categorySlug) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const result = await updateData(formData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        await refreshData();
      } else {
        setError(result.error || 'Failed to save category data');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/provider/${slug}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !provider) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline"
          >
            Return to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/provider/${slug}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to profile
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">
          Edit {provider?.business_name} Services
        </h1>
        <p className="text-gray-600 mt-2">
          Customize how your services are presented based on your profession
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">Services updated successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {categorySlug && (
        <CategoryServiceForm
          categorySlug={categorySlug}
          initialData={categoryData || {}}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {!categorySlug && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            Please select a category for your profile first to customize your service presentation.
          </p>
          <button
            onClick={() => navigate(`/provider/${slug}/edit`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}