-- Grant necessary permissions to authenticated role for portfolio_items table
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE portfolio_items TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Recreate policies with correct syntax
DROP POLICY IF EXISTS "Public can view portfolio items" ON portfolio_items;
DROP POLICY IF EXISTS "Providers can manage own portfolio" ON portfolio_items;

CREATE POLICY "Public can view portfolio items"
ON portfolio_items FOR SELECT
TO anon, authenticated
USING (is_published = true);

CREATE POLICY "Providers can manage own portfolio"
ON portfolio_items FOR ALL
TO authenticated
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);
