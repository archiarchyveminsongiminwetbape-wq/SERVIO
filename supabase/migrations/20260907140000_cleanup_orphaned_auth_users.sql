-- Clean up orphaned auth.users entries
-- This migration removes users from auth.users who no longer have corresponding profiles
-- This fixes the issue where deleted users cannot recreate accounts with the same email

-- First, identify and log orphaned users for audit purposes
CREATE OR REPLACE FUNCTION identify_orphaned_auth_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at,
    au.last_sign_in_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
  AND au.email IS NOT NULL
  AND au.email_confirmed_at IS NOT NULL;
END;
$$;

-- Function to safely delete orphaned auth users
CREATE OR REPLACE FUNCTION cleanup_orphaned_auth_users()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  result JSONB;
BEGIN
  IF NOT (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Only administrators can clean up auth users';
  END IF;
  -- Delete orphaned users from auth.users
  WITH orphaned_users AS (
    SELECT au.id
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
    AND au.email IS NOT NULL
  )
  DELETE FROM auth.users
  WHERE id IN (SELECT id FROM orphaned_users);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Orphaned auth users cleaned up successfully',
    'deleted_count', deleted_count
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
REVOKE ALL ON FUNCTION identify_orphaned_auth_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_orphaned_auth_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identify_orphaned_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_auth_users() TO authenticated;

-- Function to check if email is available for new account creation
CREATE OR REPLACE FUNCTION is_email_available(user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists BOOLEAN;
  has_profile BOOLEAN;
  result JSONB;
BEGIN
  -- Check if email exists in auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE email = user_email
  ) INTO user_exists;
  
  -- Check if user has a profile
  SELECT EXISTS(
    SELECT 1 FROM auth.users au
    JOIN public.profiles p ON au.id = p.id
    WHERE au.email = user_email
  ) INTO has_profile;
  
  -- Email is available if:
  -- 1. User doesn't exist in auth.users, OR
  -- 2. User exists but has no profile (orphaned)
  IF NOT user_exists OR (user_exists AND NOT has_profile) THEN
    result := jsonb_build_object(
      'available', true,
      'message', 'Email is available for new account creation'
    );
  ELSE
    result := jsonb_build_object(
      'available', false,
      'message', 'Email is already in use by an active account'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_email_available(TEXT) TO authenticated;

-- Improve delete_user_by_email to ensure complete cleanup
DROP FUNCTION IF EXISTS public.delete_user_by_email_complete(TEXT);

CREATE FUNCTION delete_user_by_email_complete(user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  provider_ids UUID[];
  result JSONB;
BEGIN
  IF NOT (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;
  -- Find the user_id from auth.users
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'User not found with the provided email'
    );
    RETURN result;
  END IF;

  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
  INTO provider_ids
  FROM public.provider_profiles
  WHERE user_id = target_user_id;
  
  -- Delete from all public schema tables
  DELETE FROM portfolio_items WHERE provider_id = ANY(provider_ids);
  DELETE FROM availability_slots WHERE provider_id = ANY(provider_ids);
  DELETE FROM commissions WHERE provider_id = ANY(provider_ids);
  DELETE FROM invoices WHERE provider_id = ANY(provider_ids);
  DELETE FROM conversations WHERE participant_a = target_user_id OR participant_b = target_user_id;
  DELETE FROM messages WHERE sender_id = target_user_id;
  DELETE FROM favorites WHERE user_id = target_user_id;
  DELETE FROM reviews WHERE author_id = target_user_id;
  DELETE FROM notifications WHERE user_id = target_user_id;
  DELETE FROM bookings WHERE client_id = target_user_id;
  DELETE FROM payments WHERE user_id = target_user_id;
  DELETE FROM invoices WHERE client_id = target_user_id;
  DELETE FROM user_settings WHERE user_id = target_user_id;
  DELETE FROM user_interactions WHERE user_id = target_user_id;
  DELETE FROM reports WHERE reporter_id = target_user_id;
  DELETE FROM provider_profiles WHERE id = ANY(provider_ids);
  DELETE FROM profiles WHERE id = target_user_id;
  
  -- Delete from auth.users (this is the critical step)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  result := jsonb_build_object(
    'success', true,
    'message', 'User and all related data deleted successfully. The email can now be reused for new account creation.',
    'user_id', target_user_id,
    'email', user_email
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
REVOKE ALL ON FUNCTION delete_user_by_email_complete(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_by_email_complete(TEXT) TO authenticated;

-- Cleanup is intentionally not executed during migration. Run it explicitly as an admin.
