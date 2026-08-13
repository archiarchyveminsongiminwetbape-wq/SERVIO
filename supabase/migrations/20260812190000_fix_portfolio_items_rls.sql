-- Fix RLS policies for portfolio_items table
-- Allows public read access and provider write access

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view portfolio items" ON portfolio_items;
DROP POLICY IF EXISTS "Providers can manage their own portfolio items" ON portfolio_items;
DROP POLICY IF EXISTS "Admins can manage all portfolio items" ON portfolio_items;

-- Enable RLS if not already enabled
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Public can view portfolio items (for provider profile pages)
CREATE POLICY "Public can view portfolio items"
ON portfolio_items FOR SELECT
TO public
USING (true);

-- Providers can manage their own portfolio items
CREATE POLICY "Providers can manage their own portfolio items"
ON portfolio_items FOR ALL
TO authenticated
USING (provider_id IN (
  SELECT id FROM provider_profiles WHERE user_id = auth.uid()
))
WITH CHECK (provider_id IN (
  SELECT id FROM provider_profiles WHERE user_id = auth.uid()
));

-- Admins can manage all portfolio items
CREATE POLICY "Admins can manage all portfolio items"
ON portfolio_items FOR ALL
TO authenticated
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_items TO authenticated;
GRANT SELECT ON portfolio_items TO anon;
