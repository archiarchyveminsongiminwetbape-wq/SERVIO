-- Existing provider profiles must grant provider access to their owning user.
UPDATE public.profiles AS profiles
SET role = 'provider', updated_at = NOW()
FROM public.provider_profiles AS provider_profiles
WHERE profiles.id = provider_profiles.user_id
  AND profiles.role <> 'admin'
  AND profiles.role <> 'provider';

CREATE OR REPLACE FUNCTION public.sync_provider_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'provider', updated_at = NOW()
  WHERE id = NEW.user_id
    AND role <> 'admin'
    AND role <> 'provider';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_provider_profile_role_trigger ON public.provider_profiles;

CREATE TRIGGER sync_provider_profile_role_trigger
  AFTER INSERT OR UPDATE OF user_id ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_provider_profile_role();