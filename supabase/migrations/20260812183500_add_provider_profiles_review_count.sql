-- Add missing review_count column to provider_profiles
-- This migration fixes legacy code or SQL that expects review_count in the provider_profiles table.

ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS review_count int NOT NULL DEFAULT 0;

UPDATE public.provider_profiles
SET review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE provider_id = provider_profiles.id), 0);

CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.provider_profiles
  SET rating_avg = (
    SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE provider_id = NEW.provider_id
  ),
  rating_count = (
    SELECT COUNT(*) FROM public.reviews WHERE provider_id = NEW.provider_id
  ),
  review_count = (
    SELECT COUNT(*) FROM public.reviews WHERE provider_id = NEW.provider_id
  )
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$;
