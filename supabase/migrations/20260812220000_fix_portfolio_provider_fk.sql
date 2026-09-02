-- Fix foreign key constraint for portfolio_items
-- Ensure the constraint is properly configured and add helper function

-- Drop existing foreign key constraint if it exists
ALTER TABLE public.portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_provider_id_fkey;

-- Re-create the foreign key constraint with proper settings
ALTER TABLE public.portfolio_items
  ADD CONSTRAINT portfolio_items_provider_id_fkey 
  FOREIGN KEY (provider_id) 
  REFERENCES public.provider_profiles(id) 
  ON DELETE CASCADE;

-- Create a helper function to get or create provider profile for a user
CREATE OR REPLACE FUNCTION public.get_or_create_provider_profile(target_user_id uuid, business_name text DEFAULT 'Mon entreprise')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_id uuid;
  slug text;
BEGIN
  -- Try to get existing provider profile
  SELECT id INTO provider_id FROM provider_profiles WHERE provider_profiles.user_id = target_user_id LIMIT 1;
  
  IF provider_id IS NOT NULL THEN
    RETURN provider_id;
  END IF;
  
  -- Create new provider profile if none exists
  slug := lower(regexp_replace(business_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(md5(random()::text), 1, 8);
  
  INSERT INTO provider_profiles (user_id, business_name, slug, validation_status)
  VALUES (target_user_id, business_name, slug, 'pending')
  RETURNING id INTO provider_id;
  
  RETURN provider_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_or_create_provider_profile TO authenticated;
