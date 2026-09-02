-- Repair migration for partially applied production schemas.

ALTER TABLE IF EXISTS public.invoices
  ADD COLUMN IF NOT EXISTS subscription_id UUID,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_date TIMESTAMPTZ;

UPDATE public.invoices
SET type = COALESCE(type, 'booking'),
    status = COALESCE(status, 'draft')
WHERE type IS NULL OR status IS NULL;

-- Remove rows that cannot satisfy the portfolio foreign key before recreating it.
DELETE FROM public.portfolio_items AS portfolio_items
WHERE NOT EXISTS (
  SELECT 1
  FROM public.provider_profiles AS provider_profiles
  WHERE provider_profiles.id = portfolio_items.provider_id
);

ALTER TABLE public.portfolio_items
  DROP CONSTRAINT IF EXISTS portfolio_items_provider_id_fkey;

ALTER TABLE public.portfolio_items
  ADD CONSTRAINT portfolio_items_provider_id_fkey
  FOREIGN KEY (provider_id)
  REFERENCES public.provider_profiles(id)
  ON DELETE CASCADE;

-- Existing policies are replaced instead of causing duplicate-policy errors.
DROP POLICY IF EXISTS bookings_select_client ON public.bookings;
DROP POLICY IF EXISTS payments_select_user ON public.payments;

CREATE POLICY bookings_select_client ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = client_id);

CREATE POLICY payments_select_user ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Recreate shared timestamp logic without dropping a function used by triggers.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Remove dependent invoice triggers before replacing a function whose return
-- type may have been created incorrectly by an older migration.
DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON public.invoices;
DROP FUNCTION IF EXISTS public.generate_invoice_number();

CREATE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  sequence_part INTEGER;
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number <> '' THEN
    RETURN NEW;
  END IF;

  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)), 0) + 1
  INTO sequence_part
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';

  NEW.invoice_number := 'INV-' || year_part || '-' || LPAD(sequence_part::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION public.generate_invoice_number();