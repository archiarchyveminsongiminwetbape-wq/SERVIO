-- Script pour accorder les permissions nécessaires pour la table categories
-- Permet à l'interface web d'insérer les catégories via la clé ANON

-- Activer RLS sur la table categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion à tous les utilisateurs (pour le seeding)
DROP POLICY IF EXISTS "Allow insert for all users" ON categories;
CREATE POLICY "Allow insert for all users"
ON categories
FOR INSERT
TO public
WITH CHECK (true);

-- Politique pour permettre la lecture à tous les utilisateurs
DROP POLICY IF EXISTS "Allow read for all users" ON categories;
CREATE POLICY "Allow read for all users"
ON categories
FOR SELECT
TO public
USING (true);

-- Politique pour permettre la mise à jour à tous les utilisateurs
DROP POLICY IF EXISTS "Allow update for all users" ON categories;
CREATE POLICY "Allow update for all users"
ON categories
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Politique pour permettre la suppression à tous les utilisateurs
DROP POLICY IF EXISTS "Allow delete for all users" ON categories;
CREATE POLICY "Allow delete for all users"
ON categories
FOR DELETE
TO public
USING (true);
