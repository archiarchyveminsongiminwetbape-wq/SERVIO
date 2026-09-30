-- Create certifications table for detailed provider certifications
CREATE TABLE IF NOT EXISTS certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  credential_id TEXT,
  issue_date DATE,
  expiration_date DATE,
  credential_url TEXT,
  verification_url TEXT,
  description TEXT,
  skills TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certifications_provider_id ON certifications(provider_id);
CREATE INDEX IF NOT EXISTS idx_certifications_issuing_organization ON certifications(issuing_organization);
CREATE INDEX IF NOT EXISTS idx_certifications_is_verified ON certifications(is_verified);
CREATE INDEX IF NOT EXISTS idx_certifications_verification_status ON certifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_certifications_expiration_date ON certifications(expiration_date);

-- Enable RLS
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Public can read verified certifications
CREATE POLICY "Public can read verified certifications"
  ON certifications FOR SELECT
  USING (is_verified = true);

-- Providers can read all their certifications
CREATE POLICY "Providers can read their certifications"
  ON certifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = certifications.provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Providers can insert their own certifications
CREATE POLICY "Providers can insert their certifications"
  ON certifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Providers can update their certifications
CREATE POLICY "Providers can update their certifications"
  ON certifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Providers can delete their certifications
CREATE POLICY "Providers can delete their certifications"
  ON certifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Admins can read all certifications
CREATE POLICY "Admins can read all certifications"
  ON certifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admins can update verification status
CREATE POLICY "Admins can verify certifications"
  ON certifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_certifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_certifications_updated_at_trigger
  BEFORE UPDATE ON certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_certifications_updated_at();

-- Function to check for expiring certifications
CREATE OR REPLACE FUNCTION check_expiring_certifications()
RETURNS TABLE (
  provider_id UUID,
  certification_title TEXT,
  expiration_date DATE,
  days_until_expiration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.provider_id,
    c.title as certification_title,
    c.expiration_date,
    EXTRACT(DAY FROM c.expiration_date - CURRENT_DATE)::INTEGER as days_until_expiration
  FROM certifications c
  WHERE c.expiration_date IS NOT NULL
  AND c.expiration_date >= CURRENT_DATE
  AND c.expiration_date <= CURRENT_DATE + INTERVAL '30 days'
  AND c.is_verified = true
  ORDER BY c.expiration_date ASC;
END;
$$ LANGUAGE plpgsql;
