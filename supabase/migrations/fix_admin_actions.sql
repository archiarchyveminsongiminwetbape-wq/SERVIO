-- Script pour corriger la table admin_actions et ses politiques RLS

-- Supprimer la table si elle existe pour la recréer proprement
DROP TABLE IF EXISTS public.admin_actions CASCADE;

-- Recréer la table admin_actions avec la bonne structure
-- admin_id référence profiles au lieu de auth.users pour faciliter les jointures
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour admin_actions
DROP POLICY IF EXISTS "admin_actions_select_admin" ON public.admin_actions;
CREATE POLICY "admin_actions_select_admin" ON public.admin_actions
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_actions_insert_admin" ON public.admin_actions;
CREATE POLICY "admin_actions_insert_admin" ON public.admin_actions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Créer les index pour optimiser les requêtes
CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

-- Accorder les permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
