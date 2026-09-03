-- Normalize subscriptions created by older schema versions.
ALTER TABLE IF EXISTS public.subscriptions
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS plan TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.subscriptions AS subscriptions
SET provider_id = provider_profiles.id
FROM public.provider_profiles AS provider_profiles
WHERE subscriptions.provider_id IS NULL
  AND subscriptions.user_id = provider_profiles.user_id;

UPDATE public.subscriptions
SET plan = COALESCE(plan, 'free'),
    status = COALESCE(status, 'active'),
    current_period_start = COALESCE(current_period_start, NOW()),
    current_period_end = COALESCE(current_period_end, NOW() + INTERVAL '30 days'),
    cancel_at_period_end = COALESCE(cancel_at_period_end, FALSE),
    updated_at = COALESCE(updated_at, NOW())
WHERE plan IS NULL
   OR status IS NULL
   OR current_period_start IS NULL
   OR current_period_end IS NULL
   OR cancel_at_period_end IS NULL
   OR updated_at IS NULL;

-- Keep the most recent subscription for each account before adding the
-- conflict target used by the application upsert.
WITH ranked_subscriptions AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
         ) AS subscription_rank
  FROM public.subscriptions
)
DELETE FROM public.subscriptions AS subscriptions
USING ranked_subscriptions
WHERE subscriptions.id = ranked_subscriptions.id
  AND ranked_subscriptions.subscription_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id_unique
  ON public.subscriptions(user_id);