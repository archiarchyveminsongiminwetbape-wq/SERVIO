-- Mettre à jour le système de rôles pour supporter les rôles détaillés
-- Rôles: super_admin, admin, moderator, support, finance

-- Ajouter une colonne admin_role dans la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_role TEXT CHECK (admin_role IN ('super_admin', 'admin', 'moderator', 'support', 'finance'));

-- Mettre à jour les rôles existants
UPDATE profiles SET admin_role = 'admin' WHERE role = 'admin' AND admin_role IS NULL;

-- Table pour les permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL, -- 'users', 'providers', 'content', 'finance', 'reports', 'settings'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table pour les rôles avec permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_role TEXT NOT NULL CHECK (admin_role IN ('super_admin', 'admin', 'moderator', 'support', 'finance')),
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(admin_role, permission_id)
);

-- Insérer les permissions de base
INSERT INTO permissions (name, description, category) VALUES
-- Permissions utilisateurs
('users.view', 'Voir les utilisateurs', 'users'),
('users.edit', 'Modifier les utilisateurs', 'users'),
('users.delete', 'Supprimer les utilisateurs', 'users'),
('users.ban', 'Bannir des utilisateurs', 'users'),
-- Permissions prestataires
('providers.view', 'Voir les prestataires', 'providers'),
('providers.validate', 'Valider les prestataires', 'providers'),
('providers.edit', 'Modifier les prestataires', 'providers'),
('providers.delete', 'Supprimer les prestataires', 'providers'),
-- Permissions contenu
('content.moderate', 'Modérer le contenu', 'content'),
('content.delete', 'Supprimer du contenu', 'content'),
-- Permissions finance
('finance.view', 'Voir les transactions', 'finance'),
('finance.manage', 'Gérer les paiements', 'finance'),
('finance.refund', 'Effectuer des remboursements', 'finance'),
-- Permissions signalements
('reports.view', 'Voir les signalements', 'reports'),
('reports.resolve', 'Résoudre les signalements', 'reports'),
-- Permissions paramètres
('settings.view', 'Voir les paramètres', 'settings'),
('settings.edit', 'Modifier les paramètres', 'settings')
ON CONFLICT (name) DO NOTHING;

-- Assigner les permissions par rôle
-- Super Admin: toutes les permissions
INSERT INTO role_permissions (admin_role, permission_id)
SELECT 'super_admin', id FROM permissions
ON CONFLICT (admin_role, permission_id) DO NOTHING;

-- Admin:大部分权限 (sauf finance.manage et finance.refund)
INSERT INTO role_permissions (admin_role, permission_id)
SELECT 'admin', id FROM permissions 
WHERE name NOT IN ('finance.manage', 'finance.refund')
ON CONFLICT (admin_role, permission_id) DO NOTHING;

-- Modérateur: permissions contenu et signalements
INSERT INTO role_permissions (admin_role, permission_id)
SELECT 'moderator', id FROM permissions 
WHERE category IN ('content', 'reports')
ON CONFLICT (admin_role, permission_id) DO NOTHING;

-- Support: permissions utilisateurs et signalements (view only)
INSERT INTO role_permissions (admin_role, permission_id)
SELECT 'support', id FROM permissions 
WHERE name IN ('users.view', 'reports.view', 'reports.resolve')
ON CONFLICT (admin_role, permission_id) DO NOTHING;

-- Finance: permissions finance
INSERT INTO role_permissions (admin_role, permission_id)
SELECT 'finance', id FROM permissions 
WHERE category = 'finance'
ON CONFLICT (admin_role, permission_id) DO NOTHING;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(admin_role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- Politique RLS pour role_permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view role permissions"
  ON role_permissions FOR SELECT
  USING (true);

-- Fonction pour vérifier si un utilisateur a une permission spécifique
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  has_perm BOOLEAN;
BEGIN
  -- Obtenir le rôle de l'utilisateur
  SELECT admin_role INTO user_role
  FROM profiles
  WHERE id = user_id;
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Super admin a toutes les permissions
  IF user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier si le rôle a la permission spécifique
  SELECT EXISTS(
    SELECT 1 FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.admin_role = user_role
    AND p.name = permission_name
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique RLS pour permissions
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view permissions"
  ON permissions FOR SELECT
  USING (true);
