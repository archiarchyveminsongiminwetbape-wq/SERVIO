-- Make profile and portfolio view counters reliable and observable.

DROP FUNCTION IF EXISTS public.increment_profile_views(uuid);
CREATE FUNCTION public.increment_profile_views(p_profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_views integer;
BEGIN
  UPDATE public.provider_profiles
  SET profile_views = COALESCE(profile_views, 0) + 1,
      updated_at = now()
  WHERE id = p_profile_id
  RETURNING profile_views INTO updated_views;

  IF updated_views IS NULL THEN
    RAISE EXCEPTION 'Provider profile % was not found', p_profile_id;
  END IF;

  RETURN updated_views;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_profile_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_profile_views(uuid) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.increment_portfolio_views(uuid);
CREATE FUNCTION public.increment_portfolio_views(p_item_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_views integer;
BEGIN
  UPDATE public.portfolio_items
  SET views = COALESCE(views, 0) + 1
  WHERE id = p_item_id
  RETURNING views INTO updated_views;

  IF updated_views IS NULL THEN
    RAISE EXCEPTION 'Portfolio item % was not found', p_item_id;
  END IF;

  RETURN updated_views;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_portfolio_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_portfolio_views(uuid) TO anon, authenticated;
