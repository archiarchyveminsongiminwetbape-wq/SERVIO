import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCategorySearch } from '@/hooks/useCategoryData';
import CategorySearchFilters from '@/components/CategorySearchFilters';
import { getServicePresentation } from '@/data/category-templates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ArrowLeft, MapPin, Star } from 'lucide-react';

export default function CategorySearchPage() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  const { results, template, loading, error, search } = useCategorySearch(categorySlug || '', filters);

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleSearch = () => {
    search(filters);
  };

  const handleProviderClick = (providerSlug: string) => {
    navigate(`/provider/${providerSlug}`);
  };

  if (!categorySlug) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category not specified</h1>
          <Button onClick={() => navigate('/')}>Return to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to search
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">
          {template?.name || 'Search Providers'}
        </h1>
        <p className="text-gray-600 mt-2">
          Find specialized providers in this category
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <CategorySearchFilters
            categorySlug={categorySlug}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
            resultCount={results.length}
          />
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          )}

          {error && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-red-600">
                  {error}
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && results.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your filters or search for a different category
                  </p>
                  <Button onClick={handleResetFilters}>Reset filters</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="space-y-4">
              {results.map((provider: any) => (
                <div 
                  key={provider.id}
                  onClick={() => handleProviderClick(provider.slug)}
                  className="cursor-pointer"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        {provider.avatar_url && (
                          <img
                            src={provider.avatar_url}
                            alt={provider.business_name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {provider.business_name}
                          </h3>
                          {provider.headline && (
                            <p className="text-sm text-gray-600 mt-1">{provider.headline}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            {provider.city && (
                              <span className="flex items-center gap-1">
                                <MapPin size={14} />
                                {provider.city}
                              </span>
                            )}
                            {provider.rating_avg > 0 && (
                              <span className="flex items-center gap-1">
                                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                {provider.rating_avg.toFixed(1)} ({provider.rating_count})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Category-specific preview */}
                      {provider.category_specific_data && Object.keys(provider.category_specific_data).length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          {(() => {
                            const presentation = getServicePresentation(categorySlug);
                            const highlightFields = presentation?.highlightFields || [];
                            
                            return (
                              <div className="flex flex-wrap gap-2">
                                {highlightFields.slice(0, 3).map(field => {
                                  const value = provider.category_specific_data[field];
                                  if (!value) return null;
                                  
                                  const displayValue = Array.isArray(value) ? value.slice(0, 2).join(', ') : value;
                                  return (
                                    <Badge key={field} variant="secondary" className="text-xs">
                                      {displayValue}
                                    </Badge>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}