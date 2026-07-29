/*
# SERVIO — Add get_admin_stats RPC

## What this does
Creates a SECURITY DEFINER function that returns aggregate platform statistics
for the admin dashboard: total users, providers, pending profiles, approved profiles,
open reports, and total messages.
*/

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'users', (SELECT COUNT(*) FROM public.profiles),
    'providers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'provider'),
    'pending', (SELECT COUNT(*) FROM public.provider_profiles WHERE validation_status = 'pending'),
    'approved', (SELECT COUNT(*) FROM public.provider_profiles WHERE validation_status = 'approved'),
    'reports', (SELECT COUNT(*) FROM public.reports WHERE status = 'open'),
    'messages', (SELECT COUNT(*) FROM public.messages)
  ) INTO result;
  RETURN result;
END;
$$;
