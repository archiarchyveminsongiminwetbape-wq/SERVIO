import { createClient } from '@supabase/supabase-js';

export const supabaseEnv = {
  url: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  serviceRoleKey: (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '').trim(),
};

export const hasSupabaseConfig = Boolean(supabaseEnv.url && supabaseEnv.anonKey);

if (!hasSupabaseConfig) {
  console.warn(
    'Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before running the app in production.'
  );
}

export const getSupabaseConfig = () => ({
  url: supabaseEnv.url,
  anonKey: supabaseEnv.anonKey,
  serviceRoleKey: supabaseEnv.serviceRoleKey,
});

export const supabase = createClient(
  supabaseEnv.url || 'https://placeholder.supabase.co',
  supabaseEnv.anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'servio-web',
      },
    },
  }
);
