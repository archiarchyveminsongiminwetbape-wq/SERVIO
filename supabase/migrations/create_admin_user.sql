-- Script pour créer l'utilisateur admin dans Supabase
-- Email: admin@servio.com
-- Mot de passe: admin123456

-- Vérifier si l'utilisateur existe déjà
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM auth.users
  WHERE email = 'admin@servio.com';
  
  IF user_count = 0 THEN
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
    );
    
    RAISE NOTICE 'Utilisateur admin créé';
  ELSE
    RAISE NOTICE 'Utilisateur admin existe déjà';
  END IF;
END $$;

-- Créer le profil dans profiles
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  'Administrateur',
  'admin',
  now(),
  now()
FROM auth.users 
WHERE email = 'admin@servio.com'
AND NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
);
