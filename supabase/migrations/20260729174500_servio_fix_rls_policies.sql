/*
# SERVIO — Fix RLS policies for profiles table

## What this does
1. Ensures proper RLS policies for profiles table
2. Grants necessary permissions to authenticated role
*/

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;

-- Recreate policies with proper permissions
CREATE POLICY "profiles_public_select" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
