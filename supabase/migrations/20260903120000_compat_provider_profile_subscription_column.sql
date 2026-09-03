-- Keep compatibility with databases created with the old column name.
ALTER TABLE IF EXISTS public.subscriptions
  ADD COLUMN IF NOT EXISTS provider_profile_id UUID;

UPDATE public.subscriptions
SET provider_profile_id = provider_id
WHERE provider_profile_id IS NULL
  AND provider_id IS NOT NULL;

UPDATE public.subscriptions
SET provider_id = provider_profile_id
WHERE provider_id IS NULL
  AND provider_profile_id IS NOT NULL;

ALTER TABLE IF EXISTS public.subscriptions
  ALTER COLUMN provider_profile_id SET NOT NULL;