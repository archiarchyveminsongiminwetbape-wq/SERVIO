-- Table pour suivre les interactions utilisateur avec les prestataires
-- Utilisé pour améliorer les recommandations IA
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'favorite', 'booking', 'message', 'review')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_provider ON user_interactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at DESC);

-- Index composite pour les recommandations
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_provider ON user_interactions(user_id, provider_id);

-- Politique RLS
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interactions"
  ON user_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions"
  ON user_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all interactions"
  ON user_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Fonction pour obtenir les prestataires populaires basés sur les interactions
CREATE OR REPLACE FUNCTION get_popular_providers(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  provider_id UUID,
  business_name TEXT,
  interaction_count BIGINT,
  avg_rating DECIMAL(3, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.provider_id,
    pp.business_name,
    COUNT(*) as interaction_count,
    pp.rating_avg
  FROM user_interactions ui
  JOIN provider_profiles pp ON ui.provider_id = pp.id
  WHERE ui.created_at > NOW() - INTERVAL '30 days'
  AND pp.validation_status = 'approved'
  GROUP BY ui.provider_id, pp.business_name, pp.rating_avg
  ORDER BY interaction_count DESC, pp.rating_avg DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les recommandations basées sur les interactions similaires
CREATE OR REPLACE FUNCTION get_collaborative_recommendations(user_id_param UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  provider_id UUID,
  business_name TEXT,
  score DECIMAL(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  WITH user_interacted_providers AS (
    SELECT provider_id
    FROM user_interactions
    WHERE user_id = user_id_param
  ),
  similar_users AS (
    SELECT 
      ui2.user_id,
      COUNT(*) as common_interactions
    FROM user_interactions ui1
    JOIN user_interactions ui2 ON ui1.provider_id = ui2.provider_id
    WHERE ui1.user_id = user_id_param
    AND ui2.user_id != user_id_param
    GROUP BY ui2.user_id
    HAVING COUNT(*) >= 2
    ORDER BY common_interactions DESC
    LIMIT 50
  ),
  recommended_providers AS (
    SELECT 
      ui.provider_id,
      COUNT(*) as recommendation_count,
      AVG(su.common_interactions) as similarity_score
    FROM user_interactions ui
    JOIN similar_users su ON ui.user_id = su.user_id
    WHERE ui.provider_id NOT IN (SELECT provider_id FROM user_interacted_providers)
    GROUP BY ui.provider_id
  )
  SELECT 
    rp.provider_id,
    pp.business_name,
    (rp.recommendation_count * 0.7 + rp.similarity_score * 0.3) as score
  FROM recommended_providers rp
  JOIN provider_profiles pp ON rp.provider_id = pp.id
  WHERE pp.validation_status = 'approved'
  ORDER BY score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
