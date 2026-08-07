-- Script pour corriger les politiques RLS sur les tables principales
-- Permet l'accès approprié pour les utilisateurs authentifiés et publics

-- Désactiver temporairement RLS pour réinitialiser les politiques
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Réactiver RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can view profiles"
ON profiles FOR SELECT
TO public
USING (true);

-- Politiques pour la table provider_profiles
DROP POLICY IF EXISTS "Public can view approved provider profiles" ON provider_profiles;
DROP POLICY IF EXISTS "Providers can manage their own profile" ON provider_profiles;
DROP POLICY IF EXISTS "Admins can manage all provider profiles" ON provider_profiles;

CREATE POLICY "Public can view approved provider profiles"
ON provider_profiles FOR SELECT
TO public
USING (validation_status = 'approved');

CREATE POLICY "Providers can manage their own profile"
ON provider_profiles FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all provider profiles"
ON provider_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Politiques pour la table notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications for themselves" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create notifications for themselves"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Accorder les permissions nécessaires
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
