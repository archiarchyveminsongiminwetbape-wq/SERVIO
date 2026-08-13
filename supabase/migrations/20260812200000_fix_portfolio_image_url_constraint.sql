-- Fix NOT NULL constraint on image_url column in portfolio_items
-- Since we now use the 'photos' array column, image_url should be nullable or removed

-- Option 1: Make image_url nullable (safer, maintains backward compatibility)
ALTER TABLE public.portfolio_items
  ALTER COLUMN image_url DROP NOT NULL;

-- Option 2: If you want to migrate data from image_url to photos array and remove image_url:
-- Uncomment the following lines if you prefer this approach:

-- -- Migrate existing image_url to photos array
-- UPDATE public.portfolio_items
-- SET photos = ARRAY[image_url]
-- WHERE image_url IS NOT NULL AND (photos IS NULL OR array_length(photos, 1) = 0);

-- -- Drop the old image_url column
-- ALTER TABLE public.portfolio_items DROP COLUMN IF EXISTS image_url;
