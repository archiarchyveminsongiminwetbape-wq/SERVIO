import { useState, useMemo } from 'react';

export function useDataFilter<T extends Record<string, any>>(
  data: T[],
  searchFields: (keyof T)[]
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const matchesSearch = searchTerm === '' || searchFields.some(field => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });

      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (item.status && item.status === statusFilter);

      // Method filter (if applicable)
      const matchesMethod = methodFilter === 'all' ||
        (item.payment_method && item.payment_method === methodFilter);

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [data, searchTerm, statusFilter, methodFilter, searchFields]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMethodFilter('all');
  };

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    filteredData,
    resetFilters,
    hasActiveFilters: searchTerm !== '' || statusFilter !== 'all' || methodFilter !== 'all'
  };
}
