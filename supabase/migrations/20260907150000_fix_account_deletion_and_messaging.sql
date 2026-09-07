-- Repair already-deployed functions and policies without editing old migrations.

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

DROP FUNCTION IF EXISTS public.delete_user_account(uuid);

CREATE FUNCTION public.delete_user_account(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_ids uuid[];
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Only administrators can delete another user';
  END IF;

  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
  INTO provider_ids
  FROM public.provider_profiles
  WHERE user_id = p_user_id;

  DELETE FROM public.portfolio_items WHERE provider_id = ANY(provider_ids);
  DELETE FROM public.availability_slots WHERE provider_id = ANY(provider_ids);
  DELETE FROM public.commissions WHERE provider_id = ANY(provider_ids);
  DELETE FROM public.invoices WHERE provider_id = ANY(provider_ids);
  DELETE FROM public.conversations WHERE participant_a = p_user_id OR participant_b = p_user_id;
  DELETE FROM public.messages WHERE sender_id = p_user_id;
  DELETE FROM public.favorites WHERE user_id = p_user_id;
  DELETE FROM public.reviews WHERE author_id = p_user_id;
  DELETE FROM public.notifications WHERE user_id = p_user_id;
  DELETE FROM public.bookings WHERE client_id = p_user_id;
  DELETE FROM public.payments WHERE user_id = p_user_id;
  DELETE FROM public.invoices WHERE client_id = p_user_id;
  DELETE FROM public.user_settings WHERE user_id = p_user_id;
  DELETE FROM public.user_interactions WHERE user_id = p_user_id;
  DELETE FROM public.reports WHERE reporter_id = p_user_id;
  DELETE FROM public.provider_profiles WHERE id = ANY(provider_ids);
  DELETE FROM public.profiles WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;

-- Legacy deletion RPCs were callable by any authenticated user.
REVOKE ALL ON FUNCTION public.delete_user_by_email(text) FROM PUBLIC, authenticated;
REVOKE ALL ON FUNCTION public.delete_user_by_id(uuid) FROM PUBLIC, authenticated;
