import { useState, useCallback } from 'react';

export function useAsyncOperation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const execute = useCallback(async (operation: () => Promise<T>, successMessage?: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await operation();
      
      if (successMessage) {
        setSuccess(successMessage);
      }
      
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(null);
  }, []);

  return {
    loading,
    error,
    success,
    execute,
    reset
  };
}
