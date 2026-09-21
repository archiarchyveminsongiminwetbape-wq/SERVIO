-- Partie 2: Politiques RLS pour le système d'escrow

-- Politiques RLS pour escrow_accounts
DROP POLICY IF EXISTS "escrow_select_admin" ON public.escrow_accounts;
CREATE POLICY "escrow_select_admin" ON public.escrow_accounts
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "escrow_select_client" ON public.escrow_accounts;
CREATE POLICY "escrow_select_client" ON public.escrow_accounts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = escrow_accounts.booking_id AND b.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "escrow_select_provider" ON public.escrow_accounts;
CREATE POLICY "escrow_select_provider" ON public.escrow_accounts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.provider_profiles pp ON pp.id = b.provider_id
      WHERE b.id = escrow_accounts.booking_id AND pp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "escrow_insert_admin" ON public.escrow_accounts;
CREATE POLICY "escrow_insert_admin" ON public.escrow_accounts
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "escrow_update_admin" ON public.escrow_accounts;
CREATE POLICY "escrow_update_admin" ON public.escrow_accounts
  FOR UPDATE TO authenticated USING (public.is_admin());

-- Politiques RLS pour milestones
DROP POLICY IF EXISTS "milestones_select_admin" ON public.milestones;
CREATE POLICY "milestones_select_admin" ON public.milestones
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "milestones_select_client" ON public.milestones;
CREATE POLICY "milestones_select_client" ON public.milestones
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.escrow_accounts ea
      JOIN public.bookings b ON b.id = ea.booking_id
      WHERE ea.id = milestones.escrow_id AND b.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "milestones_select_provider" ON public.milestones;
CREATE POLICY "milestones_select_provider" ON public.milestones
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.escrow_accounts ea
      JOIN public.bookings b ON b.id = ea.booking_id
      JOIN public.provider_profiles pp ON pp.id = b.provider_id
      WHERE ea.id = milestones.escrow_id AND pp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "milestones_insert_admin" ON public.milestones;
CREATE POLICY "milestones_insert_admin" ON public.milestones
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "milestones_update_admin" ON public.milestones;
CREATE POLICY "milestones_update_admin" ON public.milestones
  FOR UPDATE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "milestones_update_provider" ON public.milestones;
CREATE POLICY "milestones_update_provider" ON public.milestones
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.escrow_accounts ea
      JOIN public.bookings b ON b.id = ea.booking_id
      JOIN public.provider_profiles pp ON pp.id = b.provider_id
      WHERE ea.id = milestones.escrow_id AND pp.user_id = auth.uid()
    )
  ) WITH CHECK (
    -- Provider peut seulement marquer comme completed (soumettre preuves)
    (NEW.status = 'completed' AND OLD.status = 'pending') OR
    (public.is_admin())
  );

-- Politiques RLS pour account_certifications
DROP POLICY IF EXISTS "certifications_select_user" ON public.account_certifications;
CREATE POLICY "certifications_select_user" ON public.account_certifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "certifications_select_admin" ON public.account_certifications;
CREATE POLICY "certifications_select_admin" ON public.account_certifications
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "certifications_insert_user" ON public.account_certifications;
CREATE POLICY "certifications_insert_user" ON public.account_certifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "certifications_update_user" ON public.account_certifications;
CREATE POLICY "certifications_update_user" ON public.account_certifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "certifications_update_admin" ON public.account_certifications;
CREATE POLICY "certifications_update_admin" ON public.account_certifications
  FOR UPDATE TO authenticated USING (public.is_admin());
