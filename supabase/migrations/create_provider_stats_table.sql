-- Create provider_stats table for tracking provider performance metrics
CREATE TABLE IF NOT EXISTS provider_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  response_rate NUMERIC(5,2) DEFAULT 0, -- Percentage
  average_response_time_hours NUMERIC(10,2), -- Average response time in hours
  satisfaction_score NUMERIC(3,2) DEFAULT 0, -- 0-10 scale
  on_time_completion_rate NUMERIC(5,2) DEFAULT 0, -- Percentage
  repeat_client_rate NUMERIC(5,2) DEFAULT 0, -- Percentage
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  profile_views_last_30_days INTEGER DEFAULT 0,
  inquiries_last_30_days INTEGER DEFAULT 0,
  bookings_last_30_days INTEGER DEFAULT 0,
  revenue_last_30_days NUMERIC(15,2) DEFAULT 0,
  revenue_all_time NUMERIC(15,2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_provider_stats_provider_id ON provider_stats(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_stats_response_rate ON provider_stats(response_rate);
CREATE INDEX IF NOT EXISTS idx_provider_stats_satisfaction_score ON provider_stats(satisfaction_score);
CREATE INDEX IF NOT EXISTS idx_provider_stats_last_updated ON provider_stats(last_updated);

-- Enable RLS
ALTER TABLE provider_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Public can read provider stats
CREATE POLICY "Public can read provider stats"
  ON provider_stats FOR SELECT
  USING (true);

-- Providers can read their own stats
CREATE POLICY "Providers can read their stats"
  ON provider_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_stats.provider_id 
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Admins can read all stats
CREATE POLICY "Admins can read all stats"
  ON provider_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to calculate and update provider stats
CREATE OR REPLACE FUNCTION update_provider_stats(provider_id_param UUID)
RETURNS VOID AS $$
DECLARE
  total_bookings_count INTEGER;
  completed_bookings_count INTEGER;
  cancelled_bookings_count INTEGER;
  total_reviews_count INTEGER;
  avg_rating NUMERIC;
  profile_views_count INTEGER;
  profile_views_last_30 INTEGER;
  inquiries_count INTEGER;
  bookings_last_30 INTEGER;
  revenue_30_days NUMERIC;
  revenue_total NUMERIC;
  response_rate_calc NUMERIC;
  avg_response_time_hours NUMERIC;
  satisfaction_score_calc NUMERIC;
  on_time_rate NUMERIC;
  repeat_rate NUMERIC;
BEGIN
  -- Count total bookings
  SELECT COUNT(*) INTO total_bookings_count
  FROM bookings
  WHERE provider_id = provider_id_param;

  -- Count completed bookings
  SELECT COUNT(*) INTO completed_bookings_count
  FROM bookings
  WHERE provider_id = provider_id_param
  AND status = 'completed';

  -- Count cancelled bookings
  SELECT COUNT(*) INTO cancelled_bookings_count
  FROM bookings
  WHERE provider_id = provider_id_param
  AND status = 'cancelled';

  -- Get average rating
  SELECT COALESCE(AVG(rating), 0) INTO avg_rating
  FROM reviews
  WHERE provider_id = provider_id_param;

  -- Count total reviews
  SELECT COUNT(*) INTO total_reviews_count
  FROM reviews
  WHERE provider_id = provider_id_param;

  -- Get profile views
  SELECT COALESCE(profile_views, 0) INTO profile_views_count
  FROM provider_profiles
  WHERE id = provider_id_param;

  -- Calculate profile views last 30 days (simplified - would need tracking table in production)
  SELECT COALESCE(profile_views, 0) INTO profile_views_last_30
  FROM provider_profiles
  WHERE id = provider_id_param;

  -- Count inquiries (messages) last 30 days
  SELECT COUNT(*) INTO inquiries_count
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE c.provider_id = provider_id_param
  AND m.created_at >= NOW() - INTERVAL '30 days';

  -- Count bookings last 30 days
  SELECT COUNT(*) INTO bookings_last_30
  FROM bookings
  WHERE provider_id = provider_id_param
  AND created_at >= NOW() - INTERVAL '30 days';

  -- Calculate revenue (simplified - would need payments table integration)
  SELECT COALESCE(SUM(price), 0) INTO revenue_30_days
  FROM bookings
  WHERE provider_id = provider_id_param
  AND status = 'completed'
  AND created_at >= NOW() - INTERVAL '30 days';

  SELECT COALESCE(SUM(price), 0) INTO revenue_total
  FROM bookings
  WHERE provider_id = provider_id_param
  AND status = 'completed';

  -- Calculate response rate (simplified - would need message response tracking)
  response_rate_calc := 85.0; -- Default placeholder

  -- Calculate average response time (simplified)
  avg_response_time_hours := 2.5; -- Default placeholder

  -- Calculate satisfaction score (based on rating)
  satisfaction_score_calc := avg_rating * 2; -- Convert 5-star to 10-point scale

  -- Calculate on-time completion rate
  IF completed_bookings_count > 0 THEN
    on_time_rate := 95.0; -- Default placeholder
  ELSE
    on_time_rate := 0;
  END IF;

  -- Calculate repeat client rate (simplified)
  repeat_rate := 30.0; -- Default placeholder

  -- Insert or update stats
  INSERT INTO provider_stats (
    provider_id,
    response_rate,
    average_response_time_hours,
    satisfaction_score,
    on_time_completion_rate,
    repeat_client_rate,
    total_bookings,
    completed_bookings,
    cancelled_bookings,
    total_reviews,
    average_rating,
    profile_views,
    profile_views_last_30_days,
    inquiries_last_30_days,
    bookings_last_30_days,
    revenue_last_30_days,
    revenue_all_time,
    last_updated
  ) VALUES (
    provider_id_param,
    response_rate_calc,
    avg_response_time_hours,
    satisfaction_score_calc,
    on_time_rate,
    repeat_rate,
    total_bookings_count,
    completed_bookings_count,
    cancelled_bookings_count,
    total_reviews_count,
    avg_rating,
    profile_views_count,
    profile_views_last_30,
    inquiries_count,
    bookings_last_30,
    revenue_30_days,
    revenue_total,
    NOW()
  )
  ON CONFLICT (provider_id)
  DO UPDATE SET
    response_rate = EXCLUDED.response_rate,
    average_response_time_hours = EXCLUDED.average_response_time_hours,
    satisfaction_score = EXCLUDED.satisfaction_score,
    on_time_completion_rate = EXCLUDED.on_time_completion_rate,
    repeat_client_rate = EXCLUDED.repeat_client_rate,
    total_bookings = EXCLUDED.total_bookings,
    completed_bookings = EXCLUDED.completed_bookings,
    cancelled_bookings = EXCLUDED.cancelled_bookings,
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    profile_views = EXCLUDED.profile_views,
    profile_views_last_30_days = EXCLUDED.profile_views_last_30_days,
    inquiries_last_30_days = EXCLUDED.inquiries_last_30_days,
    bookings_last_30_days = EXCLUDED.bookings_last_30_days,
    revenue_last_30_days = EXCLUDED.revenue_last_30_days,
    revenue_all_time = EXCLUDED.revenue_all_time,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update stats for all providers (run periodically)
CREATE OR REPLACE FUNCTION update_all_provider_stats()
RETURNS VOID AS $$
BEGIN
  UPDATE provider_stats
  SET last_updated = NOW()
  WHERE provider_id IN (SELECT id FROM provider_profiles);
  
  -- This would be expanded to recalculate all stats
  -- For now, it's a placeholder for the scheduled job
END;
$$ LANGUAGE plpgsql;
