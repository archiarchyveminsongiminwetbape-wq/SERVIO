-- Clean up orphan portfolio_items and fix the foreign key issue
-- This migration removes portfolio_items that reference non-existent provider_profiles

-- First, identify orphan portfolio_items
DO $$
DECLARE
  orphan_count int;
BEGIN
  SELECT COUNT(*) INTO orphan_count 
  FROM portfolio_items pi 
  LEFT JOIN provider_profiles pp ON pi.provider_id = pp.id 
  WHERE pp.id IS NULL;
  
  RAISE NOTICE 'Found % orphan portfolio items', orphan_count;
END $$;

-- Delete orphan portfolio_items
DELETE FROM portfolio_items 
WHERE provider_id NOT IN (SELECT id FROM provider_profiles);

-- Recreate the foreign key constraint as NOT DEFERRABLE for stricter checking
ALTER TABLE public.portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_provider_id_fkey;

ALTER TABLE public.portfolio_items
  ADD CONSTRAINT portfolio_items_provider_id_fkey 
  FOREIGN KEY (provider_id) 
  REFERENCES public.provider_profiles(id) 
  ON DELETE CASCADE
  NOT DEFERRABLE;

-- Drop the auto-create trigger as it's not needed with proper logic
DROP TRIGGER IF EXISTS trg_ensure_provider_profile ON public.portfolio_items;
DROP FUNCTION IF EXISTS public.ensure_provider_profile_exists();

-- Verify no orphan items remain
DO $$
DECLARE
  remaining_orphans int;
BEGIN
  SELECT COUNT(*) INTO remaining_orphans 
  FROM portfolio_items pi 
  LEFT JOIN provider_profiles pp ON pi.provider_id = pp.id 
  WHERE pp.id IS NULL;
  
  IF remaining_orphans > 0 THEN
    RAISE EXCEPTION 'Still have % orphan portfolio items after cleanup', remaining_orphans;
  ELSE
    RAISE NOTICE 'All orphan portfolio items cleaned up successfully';
  END IF;
END $$;
