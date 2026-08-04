-- Update portfolio_items table with comprehensive fields
-- Drop existing table and recreate with enhanced structure

DROP TABLE IF EXISTS portfolio_items CASCADE;

-- Create portfolio_items table with comprehensive structure
CREATE TABLE portfolio_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Information
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  
  -- Media
  image_url TEXT NOT NULL,
  gallery_urls TEXT[] DEFAULT '{}',
  video_url TEXT,
  video_embed_url TEXT,
  
  -- Categorization
  category VARCHAR(100),
  subcategory VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  technologies TEXT[] DEFAULT '{}',
  
  -- Project Details
  project_date DATE,
  project_duration VARCHAR(100),
  project_budget VARCHAR(100),
  client_name VARCHAR(255),
  client_logo_url TEXT,
  team_size INTEGER,
  
  -- Links
  project_url TEXT,
  github_url TEXT,
  behance_url TEXT,
  dribbble_url TEXT,
  figma_url TEXT,
  instagram_url TEXT,
  other_links JSONB DEFAULT '{}',
  
  -- Status & Visibility
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold')),
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  -- Display Settings
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view portfolio items"
ON portfolio_items FOR SELECT
TO public
USING (is_published = true);

CREATE POLICY "Providers can manage own portfolio"
ON portfolio_items FOR ALL
TO authenticated
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS portfolio_items_provider_id_idx ON portfolio_items(provider_id);
CREATE INDEX IF NOT EXISTS portfolio_items_category_idx ON portfolio_items(category);
CREATE INDEX IF NOT EXISTS portfolio_items_slug_idx ON portfolio_items(slug);
CREATE INDEX IF NOT EXISTS portfolio_items_status_idx ON portfolio_items(status);
CREATE INDEX IF NOT EXISTS portfolio_items_featured_idx ON portfolio_items(is_featured);
CREATE INDEX IF NOT EXISTS portfolio_items_published_idx ON portfolio_items(is_published);
CREATE INDEX IF NOT EXISTS portfolio_items_sort_order_idx ON portfolio_items(sort_order);
CREATE INDEX IF NOT EXISTS portfolio_items_created_at_idx ON portfolio_items(created_at DESC);
CREATE INDEX IF NOT EXISTS portfolio_items_tags_idx ON portfolio_items USING GIN(tags);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE portfolio_items;
