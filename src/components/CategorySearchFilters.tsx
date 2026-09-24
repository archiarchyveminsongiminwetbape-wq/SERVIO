import React, { useState } from 'react';
import { getCategoryTemplate, getCategoryFields } from '@/data/category-templates';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react';

interface CategorySearchFiltersProps {
  categorySlug: string;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onReset: () => void;
  resultCount?: number;
}

export default function CategorySearchFilters({ 
  categorySlug, 
  filters, 
  onFiltersChange, 
  onReset,
  resultCount = 0 
}: CategorySearchFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const template = getCategoryTemplate(categorySlug);
  const fields = template?.fields || [];

  const handleFieldChange = (fieldId: string, value: any) => {
    onFiltersChange({
      ...filters,
      [fieldId]: value
    });
  };

  const handleMultiSelectChange = (fieldId: string, option: string, checked: boolean) => {
    const currentValues = filters[fieldId] || [];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, option];
    } else {
      newValues = currentValues.filter((v: string) => v !== option);
    }
    
    handleFieldChange(fieldId, newValues);
  };

  const renderField = (field: any) => {
    const value = filters[field.id];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
              id={field.id}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>
            <Select
              value={value || ''}
              onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'All'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="grid grid-cols-2 gap-2">
              {field.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={(value || []).includes(option)}
                    onCheckedChange={(checked) => 
                      handleMultiSelectChange(field.id, option, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`${field.id}-${option}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {value && value.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {value.map((selected: string) => (
                  <Badge key={selected} variant="secondary" className="flex items-center gap-1">
                    {selected}
                    <button
                      type="button"
                      onClick={() => handleMultiSelectChange(field.id, selected, false)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={value || ''}
                onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || '')}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                className="flex-1"
              />
              {field.unit && <span className="text-sm text-gray-500">{field.unit}</span>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const activeFiltersCount = Object.values(filters).filter(
    value => value !== undefined && value !== null && value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  const hasFilters = activeFiltersCount > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Filters
            {hasFilters && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-gray-500"
              >
                <X className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
        {resultCount > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            {resultCount} {resultCount === 1 ? 'result' : 'results'}
          </p>
        )}
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="space-y-4">
            {fields.map(renderField)}
            
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => setExpanded(false)} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}