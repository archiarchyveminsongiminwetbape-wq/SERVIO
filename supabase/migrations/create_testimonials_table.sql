-- Create testimonials table for client testimonials on provider profiles
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_avatar_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  testimonial TEXT NOT NULL,
  project_title TEXT,
  project_date DATE,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_testimonials_provider_id ON testimonials(provider_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_client_id ON testimonials(client_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_verified ON testimonials(is_verified);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Public can read verified testimonials
CREATE POLICY "Public can read verified testimonials"
  ON testimonials FOR SELECT
  USING (is_verified = true);

-- Providers can read all their testimonials
CREATE POLICY "Providers can read their testimonials"
  ON testimonials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = testimonials.provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Clients can read their own testimonials
CREATE POLICY "Clients can read their own testimonials"
  ON testimonials FOR SELECT
  USING (auth.uid() = client_id);

-- Providers can insert testimonials (for their clients)
CREATE POLICY "Providers can insert testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Providers can update their testimonials
CREATE POLICY "Providers can update their testimonials"
  ON testimonials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Providers can delete their testimonials
CREATE POLICY "Providers can delete their testimonials"
  ON testimonials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Admins can read all testimonials
CREATE POLICY "Admins can read all testimonials"
  ON testimonials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_testimonials_updated_at_trigger
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonials_updated_at();
