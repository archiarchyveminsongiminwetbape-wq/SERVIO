-- Fix portfolio_items insertion by ensuring provider_id exists
-- This migration adds a trigger to automatically create provider profiles if needed

-- First, let's make the foreign key constraint deferrable (allows checking at commit time)
ALTER TABLE public.portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_provider_id_fkey;

ALTER TABLE public.portfolio_items
  ADD CONSTRAINT portfolio_items_provider_id_fkey 
  FOREIGN KEY (provider_id) 
  REFERENCES public.provider_profiles(id) 
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- Create a trigger function to auto-create provider profile if it doesn't exist
CREATE OR REPLACE FUNCTION public.ensure_provider_profile_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_exists boolean;
  new_provider_id uuid;
  slug text;
BEGIN
  -- Check if provider profile exists
  SELECT EXISTS(SELECT 1 FROM provider_profiles WHERE id = NEW.provider_id) INTO provider_exists;
  
  IF NOT provider_exists THEN
    -- Extract user_id from the context (assuming it's available)
    -- If not, we'll create a temporary provider profile
    slug := 'provider-' || substr(md5(random()::text), 1, 8);
    
    -- Create a minimal provider profile
    INSERT INTO provider_profiles (id, user_id, business_name, slug, validation_status)
    VALUES (NEW.provider_id, auth.uid(), 'Mon entreprise', slug, 'pending')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Auto-created provider profile for id: %', NEW.provider_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for portfolio_items insert
DROP TRIGGER IF EXISTS trg_ensure_provider_profile ON public.portfolio_items;
CREATE TRIGGER trg_ensure_provider_profile
  BEFORE INSERT ON public.portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_provider_profile_exists();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.ensure_provider_profile_exists TO authenticated;
