-- Protect profile contact data and complete portfolio view tracking.

DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
CREATE POLICY "profiles_owner_admin_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_conversation_participant_select" ON public.profiles;
CREATE POLICY "profiles_conversation_participant_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
        AND (c.participant_a = profiles.id OR c.participant_b = profiles.id)
    )
  );

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS views int NOT NULL DEFAULT 0;

DROP FUNCTION IF EXISTS public.increment_portfolio_views(uuid);

CREATE FUNCTION public.increment_portfolio_views(item_id uuid)
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
