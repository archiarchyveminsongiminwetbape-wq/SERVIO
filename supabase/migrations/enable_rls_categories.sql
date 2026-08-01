-- Script pour réactiver RLS sur la table categories après le seeding
-- Configure des politiques de sécurité appropriées

-- Activer RLS sur la table categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous les utilisateurs
DROP POLICY IF EXISTS "Allow read for all users" ON categories;
CREATE POLICY "Allow read for all users"
ON categories
FOR SELECT
TO public
USING (true);

-- Politique pour permettre l'insertion uniquement aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Allow insert for authenticated" ON categories;
CREATE POLICY "Allow insert for authenticated"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique pour permettre la mise à jour uniquement aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Allow update for authenticated" ON categories;
CREATE POLICY "Allow update for authenticated"
ON categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Politique pour permettre la suppression uniquement aux administrateurs
DROP POLICY IF EXISTS "Allow delete for admin" ON categories;
CREATE POLICY "Allow delete for admin"
ON categories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
