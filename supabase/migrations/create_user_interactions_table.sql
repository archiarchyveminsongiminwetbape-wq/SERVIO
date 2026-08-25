-- Create user_interactions table for tracking user behavior for recommendations
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_profile_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'favorite', 'message', 'booking', 'review')),
  interaction_value INTEGER DEFAULT 1, -- Weight for the interaction (higher = more important)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_provider_profile_id ON user_interactions(provider_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_provider ON user_interactions(user_id, provider_profile_id);

-- Enable RLS
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own interactions
CREATE POLICY "Users can read their own interactions"
  ON user_interactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own interactions
CREATE POLICY "Users can insert their own interactions"
  ON user_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all interactions
CREATE POLICY "Admins can read all interactions"
  ON user_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to get recommended providers for a user
CREATE OR REPLACE FUNCTION get_recommended_providers(user_id_param UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  provider_profile_id UUID,
  business_name TEXT,
  slug TEXT,
  headline TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  rating_avg NUMERIC,
  rating_count INTEGER,
  category_id UUID,
  city TEXT,
  country TEXT,
  skills TEXT[],
  score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH user_categories AS (
    SELECT DISTINCT pp.category_id, COUNT(*) as category_count
    FROM user_interactions ui
    JOIN provider_profiles pp ON ui.provider_profile_id = pp.id
    WHERE ui.user_id = user_id_param
    AND ui.interaction_type IN ('favorite', 'booking', 'review')
    GROUP BY pp.category_id
    ORDER BY category_count DESC
    LIMIT 5
  ),
  user_skills AS (
    SELECT DISTINCT unnest(pp.skills) as skill, COUNT(*) as skill_count
    FROM user_interactions ui
    JOIN provider_profiles pp ON ui.provider_profile_id = pp.id
    WHERE ui.user_id = user_id_param
    AND ui.interaction_type IN ('favorite', 'booking', 'review')
    GROUP BY unnest(pp.skills)
    ORDER BY skill_count DESC
    LIMIT 10
  ),
  scored_providers AS (
    SELECT 
      pp.id as provider_profile_id,
      pp.business_name,
      pp.slug,
      pp.headline,
      pp.avatar_url,
      pp.banner_url,
      pp.rating_avg,
      pp.rating_count,
      pp.category_id,
      pp.city,
      pp.country,
      pp.skills,
      -- Calculate score based on category match
      COALESCE(
        (SELECT SUM(category_count) FROM user_categories WHERE user_categories.category_id = pp.category_id) * 3,
        0
      ) +
      -- Calculate score based on skill match
      COALESCE(
        (SELECT SUM(skill_count) FROM user_skills WHERE user_skills.skill = ANY(pp.skills)) * 2,
        0
      ) +
      -- Bonus for high ratings
      COALESCE(pp.rating_avg, 0) * 0.5 +
      -- Bonus for featured providers
      CASE WHEN pp.is_featured THEN 2 ELSE 0 END as score
    FROM provider_profiles pp
    WHERE pp.validation_status = 'approved'
    AND pp.id NOT IN (
      SELECT provider_profile_id FROM user_interactions WHERE user_id = user_id_param
    )
  )
  SELECT *
  FROM scored_providers
  WHERE score > 0
  ORDER BY score DESC, rating_avg DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
