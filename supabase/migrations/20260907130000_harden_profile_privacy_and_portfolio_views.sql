-- Protect profile contact data and complete portfolio view tracking.

DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
CREATE POLICY "profiles_owner_admin_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS views int NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_portfolio_views(item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.portfolio_items
  SET views = COALESCE(views, 0) + 1
  WHERE id = item_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_portfolio_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_portfolio_views(uuid) TO anon, authenticated;
