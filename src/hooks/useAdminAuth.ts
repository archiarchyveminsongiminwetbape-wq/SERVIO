import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAdminAuth() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Non authentifié');
        setLoading(false);
        return;
      }

      setCurrentUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        setError('Accès non autorisé');
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setError('Erreur lors de la vérification des droits');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return {
    currentUser,
    isAdmin,
    loading,
    error,
    logout,
    refreshStatus: checkAdminStatus
  };
}
