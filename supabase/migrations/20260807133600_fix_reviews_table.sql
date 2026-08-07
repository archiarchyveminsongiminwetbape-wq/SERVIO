-- Fix reviews table to make booking_id optional
-- This allows users to leave reviews without requiring a completed booking

-- First, drop the UNIQUE constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reviews_booking_id_key' 
        AND conrelid = 'reviews'::regclass
    ) THEN
        ALTER TABLE reviews DROP CONSTRAINT reviews_booking_id_key;
    END IF;
END $$;

-- Then make booking_id nullable
ALTER TABLE reviews ALTER COLUMN booking_id DROP NOT NULL;

-- Update the RLS policy to allow reviews without booking_id
DROP POLICY IF EXISTS "Users can insert reviews for their bookings" ON reviews;

CREATE POLICY "Users can insert reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
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
