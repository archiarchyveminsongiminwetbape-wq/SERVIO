/*
# SERVIO — Add increment_profile_views RPC

## What this does
Creates a SECURITY DEFINER function to safely increment the profile_views counter
on a provider profile. This avoids RLS issues when an anonymous visitor views a profile.
Returns the new profile_views count after incrementing.
*/

CREATE OR REPLACE FUNCTION public.increment_profile_views(profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_views integer;
BEGIN
  UPDATE public.provider_profiles
  SET profile_views = profile_views + 1
  WHERE id = profile_id
  RETURNING profile_views INTO new_views;
  
  RETURN new_views;
END;
$$;
