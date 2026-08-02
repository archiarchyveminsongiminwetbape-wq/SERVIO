-- Script pour corriger la table admin_actions et ses politiques RLS

-- Vérifier si la table admin_actions existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_actions') THEN
        CREATE TABLE public.admin_actions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          action_type text NOT NULL,
          target_type text,
          target_id uuid,
          details jsonb DEFAULT '{}',
          created_at timestamptz NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Table admin_actions créée';
    ELSE
        RAISE NOTICE 'Table admin_actions existe déjà';
    END IF;
END $$;

-- Créer les politiques RLS pour admin_actions
DROP POLICY IF EXISTS "admin_actions_select_admin" ON public.admin_actions;
CREATE POLICY "admin_actions_select_admin" ON public.admin_actions
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_actions_insert_admin" ON public.admin_actions;
CREATE POLICY "admin_actions_insert_admin" ON public.admin_actions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Créer un index sur admin_id pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

-- Accorder les permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
