-- Fix reviews table to make author_id nullable and add booking_id
-- This allows users to leave reviews without requiring a completed booking

-- Add booking_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' 
        AND column_name = 'booking_id'
    ) THEN
        ALTER TABLE reviews ADD COLUMN booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update the RLS policy to allow reviews without booking_id
DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;

CREATE POLICY "reviews_insert_own"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
);

-- Update the trigger function to handle reviews without booking_id
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE provider_profiles
  SET 
    rating_avg = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    )
  WHERE user_id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
