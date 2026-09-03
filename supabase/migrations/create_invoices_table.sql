-- Ensure the subscriptions table exists before wiring foreign key references.
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT
);

-- Create invoices table for billing system
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  subscription_id UUID,
  type TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS invoices
  ADD COLUMN IF NOT EXISTS subscription_id UUID;

ALTER TABLE IF EXISTS invoices
  ADD COLUMN IF NOT EXISTS type TEXT;

ALTER TABLE IF EXISTS invoices
  ADD COLUMN IF NOT EXISTS status TEXT;

ALTER TABLE IF EXISTS invoices
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

UPDATE invoices
SET type = COALESCE(type, 'booking')
WHERE type IS NULL;

UPDATE invoices
SET status = COALESCE(status, 'draft')
WHERE status IS NULL;

ALTER TABLE IF EXISTS invoices
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'draft';

-- Add FK only if the column exists and the constraint is missing.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'subscription_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.invoices'::regclass AND conname = 'invoices_subscription_id_fkey'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_subscription_id_fkey
      FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_provider_id ON invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies only if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Users can read their own invoices'
  ) THEN
    CREATE POLICY "Users can read their own invoices"
      ON invoices FOR SELECT
      USING (auth.uid() = client_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Users can insert their own invoices'
  ) THEN
    CREATE POLICY "Users can insert their own invoices"
      ON invoices FOR INSERT
      WITH CHECK (auth.uid() = client_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Users can update their own draft invoices'
  ) THEN
    CREATE POLICY "Users can update their own draft invoices"
      ON invoices FOR UPDATE
      USING (auth.uid() = client_id AND status = 'draft');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Providers can read invoices for their profile'
  ) THEN
    CREATE POLICY "Providers can read invoices for their profile"
      ON invoices FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM provider_profiles
          WHERE provider_profiles.id = invoices.provider_id 
          AND provider_profiles.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Admins can read all invoices'
  ) THEN
    CREATE POLICY "Admins can read all invoices"
      ON invoices FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Function to generate invoice number
DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON invoices;
DROP FUNCTION IF EXISTS generate_invoice_number();
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_part INTEGER;
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number <> '' THEN
    RETURN NEW;
  END IF;

  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)), 0) + 1
  INTO seq_part
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';

  NEW.invoice_number := 'INV-' || year_part || '-' || LPAD(seq_part::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoices_updated_at_trigger ON invoices;
CREATE TRIGGER update_invoices_updated_at_trigger
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION generate_invoice_number();

CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS VOID AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status IN ('sent')
  AND due_date < NOW()
  AND paid_date IS NULL;
END;
$$ LANGUAGE plpgsql;
