-- Drop existing portfolio_items table if it exists with wrong structure
DROP TABLE IF EXISTS portfolio_items CASCADE;

-- Create portfolio_items table with correct structure
CREATE TABLE portfolio_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category VARCHAR(100),
  project_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view portfolio items"
ON portfolio_items FOR SELECT
TO public
USING (true);

CREATE POLICY "Providers can manage own portfolio"
ON portfolio_items FOR ALL
TO authenticated
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

-- Create indexes
CREATE INDEX portfolio_items_provider_id_idx ON portfolio_items(provider_id);
CREATE INDEX portfolio_items_category_idx ON portfolio_items(category);
CREATE INDEX portfolio_items_sort_order_idx ON portfolio_items(sort_order);
CREATE INDEX portfolio_items_created_at_idx ON portfolio_items(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE portfolio_items;
