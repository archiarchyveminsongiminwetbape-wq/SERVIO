/*
# SERVIO — Core Schema Part 1: profiles, categories, provider_profiles

## Overview
Creates foundational tables for the SERVIO platform.

## New Tables
1. `profiles` — extends auth.users with role (visitor/provider/admin), display info, status
2. `categories` — sectors of activity with parent hierarchy
3. `provider_profiles` — provider vitrine with validation status, badges, rating

## Security
- RLS enabled on all tables.
- is_admin() helper checks JWT app_metadata role.
- Public read on profiles, categories, and approved provider profiles.
- Owner-scoped writes; admin can manage categories and update profiles/provider_profiles.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'visitor' CHECK (role IN ('visitor','provider','admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','banned')),
  phone text,
  country text NOT NULL DEFAULT 'FR',
  currency text NOT NULL DEFAULT 'EUR',
  language text NOT NULL DEFAULT 'fr',
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
CREATE POLICY "profiles_public_select" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  icon text,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
CREATE POLICY "categories_public_select" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.provider_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  headline text,
  description text,
  avatar_url text,
  banner_url text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  skills text[] NOT NULL DEFAULT '{}',
  experience_years int,
  languages text[] NOT NULL DEFAULT '{}',
  certifications text,
  city text,
  country text NOT NULL DEFAULT 'FR',
  currency text NOT NULL DEFAULT 'EUR',
  service_area text,
  remote_service boolean NOT NULL DEFAULT false,
  phone text,
  website text,
  social_links jsonb NOT NULL DEFAULT '{}',
  price_range text,
  availability text NOT NULL DEFAULT 'available' CHECK (availability IN ('available','busy','unavailable')),
  validation_status text NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending','approved','rejected','changes_requested')),
  validation_note text,
  validated_at timestamptz,
  validated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  badges text[] NOT NULL DEFAULT '{}',
  rating_avg numeric(2,1) NOT NULL DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  profile_views int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_provider_profiles_status ON public.provider_profiles(validation_status);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_category ON public.provider_profiles(category_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_user ON public.provider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_city ON public.provider_profiles(city);

DROP POLICY IF EXISTS "provider_profiles_public_select" ON public.provider_profiles;
CREATE POLICY "provider_profiles_public_select" ON public.provider_profiles
  FOR SELECT TO anon, authenticated
  USING (validation_status = 'approved' OR user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "provider_profiles_insert_own" ON public.provider_profiles;
CREATE POLICY "provider_profiles_insert_own" ON public.provider_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "provider_profiles_update_own" ON public.provider_profiles;
CREATE POLICY "provider_profiles_update_own" ON public.provider_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "provider_profiles_admin_update" ON public.provider_profiles;
CREATE POLICY "provider_profiles_admin_update" ON public.provider_profiles
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_provider_profiles_updated_at ON public.provider_profiles;
CREATE TRIGGER trg_provider_profiles_updated_at BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
