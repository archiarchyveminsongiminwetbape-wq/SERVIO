-- Add payments table for payment integration

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'refunded'
  payment_method text NOT NULL, -- 'card', 'bank_transfer', 'paypal', 'cash'
  payment_provider text, -- 'stripe', 'paypal', 'manual'
  provider_payment_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  refund_reason text
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL,
  paid_at timestamptz,
  status text NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  subtotal numeric(10, 2) NOT NULL,
  tax numeric(10, 2) NOT NULL DEFAULT 0,
  total numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
DROP POLICY IF EXISTS "payments_select_user" ON public.payments;
CREATE POLICY "payments_select_user" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_select_provider" ON public.payments;
CREATE POLICY "payments_select_provider" ON public.payments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.provider_profiles pp ON pp.id = b.provider_id
      WHERE b.id = payments.booking_id AND pp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "payments_select_admin" ON public.payments;
CREATE POLICY "payments_select_admin" ON public.payments
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "payments_insert_user" ON public.payments;
CREATE POLICY "payments_insert_user" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;
CREATE POLICY "payments_update_admin" ON public.payments
  FOR UPDATE TO authenticated USING (public.is_admin());

-- Create policies for invoices
DROP POLICY IF EXISTS "invoices_select_user" ON public.invoices;
CREATE POLICY "invoices_select_user" ON public.invoices
  FOR SELECT TO authenticated USING (auth.uid() = (SELECT user_id FROM public.payments WHERE id = invoices.payment_id));

DROP POLICY IF EXISTS "invoices_select_provider" ON public.invoices;
CREATE POLICY "invoices_select_provider" ON public.invoices
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.provider_profiles pp ON pp.id = b.provider_id
      WHERE b.id = invoices.booking_id AND pp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "invoices_select_admin" ON public.invoices;
CREATE POLICY "invoices_select_admin" ON public.invoices
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "invoices_insert_admin" ON public.invoices;
CREATE POLICY "invoices_insert_admin" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "invoices_update_admin" ON public.invoices;
CREATE POLICY "invoices_update_admin" ON public.invoices
  FOR UPDATE TO authenticated USING (public.is_admin());

-- Create indexes
CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX idx_invoices_payment_id ON public.invoices(payment_id);
CREATE INDEX idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT SELECT ON public.invoices TO authenticated;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  invoice_num text;
  year text := to_char(current_date, 'YYYY');
  month text := to_char(current_date, 'MM');
  seq_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(substring(invoice_number FROM 12) AS integer)), 0) + 1
  INTO seq_num
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || year || month || '-%';
  
  invoice_num := 'INV-' || year || month || '-' || LPAD(seq_num::text, 6, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;
