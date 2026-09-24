import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import CategoryStatsDisplay from '@/components/CategoryStatsDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminCategoryStatsPage() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    // Force refresh by changing the component key or using a refresh prop
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
    // Export functionality would go here
    console.log('Export stats for category:', categorySlug);
  };

  if (!categorySlug) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category not specified</h1>
          <Button onClick={() => navigate('/admin')}>Return to admin</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to admin
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Category Statistics
            </h1>
            <p className="text-gray-600 mt-2">
              Analytics for providers in this category
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <CategoryStatsDisplay categorySlug={categorySlug} />
    </div>
  );
}