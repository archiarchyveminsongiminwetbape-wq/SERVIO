/*
# SERVIO — Fix admin permissions and profile

## What this does
1. Grants service_role permissions on public tables
2. Ensures admin profile exists and has correct role
*/

-- Grant service_role permissions on key tables
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.provider_profiles TO service_role;
GRANT ALL ON public.notifications TO service_role;

-- Ensure admin profile exists with correct role
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@servio.com';
  
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (admin_id, 'admin@servio.com', 'Administrateur SERVIO', 'admin', 'active')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', email = 'admin@servio.com', status = 'active', updated_at = now();
    
    RAISE NOTICE 'Admin profile created/updated for user ID: %', admin_id;
  ELSE
    RAISE NOTICE 'Admin user not found';
  END IF;
END $$;
