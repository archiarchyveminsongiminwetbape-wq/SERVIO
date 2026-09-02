-- Keep one provider profile per account and prevent future duplicates.
-- The profile with the strongest existing data is kept first.
WITH ranked_profiles AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY
        (validation_status = 'approved') DESC,
        rating_count DESC,
        (avatar_url IS NOT NULL) DESC,
        (headline IS NOT NULL AND headline <> '') DESC,
        created_at ASC,
        id ASC
    ) AS profile_rank
  FROM public.provider_profiles
)
DELETE FROM public.provider_profiles AS provider_profiles
USING ranked_profiles
WHERE provider_profiles.id = ranked_profiles.id
  AND ranked_profiles.profile_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_profiles_user_id_unique
  ON public.provider_profiles(user_id);