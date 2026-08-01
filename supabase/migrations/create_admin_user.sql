-- Script pour créer l'utilisateur admin dans Supabase
-- Email: admin@servio.com
-- Mot de passe: admin123456

-- Insérer l'utilisateur dans auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@servio.com',
  crypt('admin123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '{"provider":"email","role":"admin"}'::jsonb,
  '{"full_name":"Administrateur","role":"admin"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- Créer le profil dans profiles
INSERT INTO profiles (
  id,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT 
  id,
  'Administrateur',
  'admin',
  now(),
  now()
FROM auth.users 
WHERE email = 'admin@servio.com'
ON CONFLICT (id) DO NOTHING;
