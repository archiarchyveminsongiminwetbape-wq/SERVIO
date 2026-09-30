-- Script pour accorder les permissions explicites à l'utilisateur ANON/authenticated
-- Permet l'accès à la table categories via la clé ANON

-- Accorder les permissions sur la table categories
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.categories TO anon, authenticated;

-- Désactiver RLS temporairement pour le seeding
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
