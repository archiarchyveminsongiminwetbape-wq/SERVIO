import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: { full_name: string; role: string }) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; profileRole?: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await fetchProfile(session.user.id, session.user);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string, authUser?: User): Promise<Profile | null> {
    const [{ data, error }, { data: providerData, error: providerError }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', userId)
        .order('rating_count', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    if (error) {
      console.error('Error fetching profile:', error);
    }
    if (providerError) {
      console.error('Error checking provider profile:', providerError);
    }

    let profileData = data;

    if (!profileData && authUser?.email) {
      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name ?? authUser.email,
            role: providerData ? 'provider' : (authUser.user_metadata?.role ?? 'visitor'),
          },
          { onConflict: 'id' },
        )
        .select('*')
        .maybeSingle();

      if (createError) {
        console.error('Error creating missing profile:', createError);
      } else {
        profileData = createdProfile;
      }
    }

    const resolvedProfile = profileData
      ? ({ ...profileData, role: providerData ? 'provider' : profileData.role } as Profile)
      : null;

    setProfile(resolvedProfile);
    setLoading(false);
    return resolvedProfile;
  }

  async function signUp(email: string, password: string, metadata: { full_name: string; role: string }) {
    // Try to sign up
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    
    if (error) {
      console.error('Signup error:', error);
      return { error: error.message ?? null };
    }
    
    // Si l'inscription réussit avec session, l'utilisateur est connecté
    if (data.session) {
      // Créer manuellement le profil si le trigger ne fonctionne pas
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: metadata.full_name,
              role: metadata.role,
            });
          
          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Le trigger a peut-être déjà créé le profil, ignorer l'erreur
          }
        } catch (e) {
          console.error('Profile creation failed:', e);
        }
      }
      return { error: null };
    }
    
    // Si pas de session (email confirmation activée), rediriger vers login
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message ?? null };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const resolvedProfile = await fetchProfile(session.user.id, session.user);
      return { error: null, profileRole: resolvedProfile?.role ?? null };
    }

    return { error: null, profileRole: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id, user);
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
