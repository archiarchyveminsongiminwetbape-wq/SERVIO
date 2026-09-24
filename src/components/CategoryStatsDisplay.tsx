import React from 'react';
import { useCategoryStats } from '@/hooks/useCategoryData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart3, TrendingUp, Users, Award } from 'lucide-react';

interface CategoryStatsDisplayProps {
  categorySlug: string;
}

export default function CategoryStatsDisplay({ categorySlug }: CategoryStatsDisplayProps) {
  const { stats, loading, error } = useCategoryStats(categorySlug);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Category Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overview stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Total Providers</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.total_providers}</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Fields Available</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{Object.keys(stats.field_stats).length}</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Data Points</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {Object.values(stats.field_stats).reduce((sum: number, stat: any) => sum + (stat.total || 0), 0)}
              </p>
            </div>
          </div>

          {/* Field-specific stats */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Distribution</h3>
            <div className="space-y-4">
              {Object.entries(stats.field_stats).map(([fieldId, fieldStat]: [string, any]) => {
                if (fieldStat.type === 'distribution') {
                  return (
                    <div key={fieldId} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900 capitalize">
                          {fieldId.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-gray-500">{fieldStat.total} providers</span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(fieldStat.data).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 5).map(([option, count]) => (
                          <div key={option} className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${((count as number) / fieldStat.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-32 text-right">
                              {option} ({count as number})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } else if (fieldStat.type === 'numeric') {
                  return (
                    <div key={fieldId} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900 capitalize">
                          {fieldId.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-gray-500">{fieldStat.total} providers</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Average</span>
                          <p className="font-semibold text-gray-900">{fieldStat.average?.toFixed(1)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Min</span>
                          <p className="font-semibold text-gray-900">{fieldStat.min}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Max</span>
                          <p className="font-semibold text-gray-900">{fieldStat.max}</p>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={fieldId} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 capitalize">
                          {fieldId.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-gray-500">{fieldStat.total} providers</span>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}