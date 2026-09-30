-- Create quotes table for provider quotes/estimates
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  project_title TEXT NOT NULL,
  project_description TEXT,
  service_type TEXT NOT NULL,
  estimated_hours NUMERIC,
  hourly_rate NUMERIC,
  fixed_price NUMERIC,
  currency TEXT NOT NULL DEFAULT 'EUR',
  estimated_total NUMERIC,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  terms TEXT,
  notes TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_provider_id ON quotes(provider_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Providers can read their own quotes
CREATE POLICY "Providers can read their quotes"
  ON quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = quotes.provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Clients can read quotes sent to them
CREATE POLICY "Clients can read their quotes"
  ON quotes FOR SELECT
  USING (auth.uid() = client_id);

-- Providers can insert their own quotes
CREATE POLICY "Providers can insert their quotes"
  ON quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Providers can update their quotes
CREATE POLICY "Providers can update their quotes"
  ON quotes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Providers can delete their draft quotes
CREATE POLICY "Providers can delete their draft quotes"
  ON quotes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
    AND status = 'draft'
  );

-- Clients can accept quotes sent to them
CREATE POLICY "Clients can accept quotes"
  ON quotes FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (
    auth.uid() = client_id 
    AND status = 'sent'
    AND NEW.status = 'accepted'
  );

-- Clients can reject quotes sent to them
CREATE POLICY "Clients can reject quotes"
  ON quotes FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (
    auth.uid() = client_id 
    AND status = 'sent'
    AND NEW.status = 'rejected'
  );

-- Admins can read all quotes
CREATE POLICY "Admins can read all quotes"
  ON quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Update timestamps based on status changes
  IF NEW.status != OLD.status THEN
    IF NEW.status = 'sent' AND OLD.status = 'draft' THEN
      NEW.sent_at = NOW();
    ELSIF NEW.status = 'accepted' AND OLD.status = 'sent' THEN
      NEW.accepted_at = NOW();
    ELSIF NEW.status = 'rejected' AND OLD.status = 'sent' THEN
      NEW.rejected_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at and status timestamps
CREATE TRIGGER update_quotes_updated_at_trigger
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- Function to mark expired quotes
CREATE OR REPLACE FUNCTION mark_expired_quotes()
RETURNS VOID AS $$
BEGIN
  UPDATE quotes
  SET status = 'expired'
  WHERE status = 'sent'
  AND valid_until < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
