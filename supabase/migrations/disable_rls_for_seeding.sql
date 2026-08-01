-- Script temporaire pour désactiver RLS sur la table categories
-- Permet le seeding via l'interface web
-- À réactiver après le seeding avec des politiques appropriées

-- Désactiver RLS temporairement
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Note: Après le seeding, réactivez RLS avec:
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- Et ajoutez les politiques de sécurité appropriées
