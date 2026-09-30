-- Add automatic profile view counting trigger
-- This trigger automatically increments profile_views when a profile is viewed
-- through a trigger on a view or when accessed via API

-- First, create a function to increment views with session tracking
CREATE OR REPLACE FUNCTION public.track_profile_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Increment profile views counter
  UPDATE public.provider_profiles
  SET profile_views = profile_views + 1
  WHERE id = NEW.provider_id;
  
  RETURN NEW;
END;
$$;

-- Create a view tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profile_view_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewer_ip TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(viewer_id, provider_id, viewed_at::date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profile_view_logs_provider_id ON public.profile_view_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_profile_view_logs_viewer_id ON public.profile_view_logs(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_view_logs_viewed_at ON public.profile_view_logs(viewed_at DESC);

-- Create a function to log and increment views
CREATE OR REPLACE FUNCTION public.log_and_increment_profile_view(p_provider_id uuid, p_viewer_id uuid DEFAULT NULL, p_viewer_ip TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_views integer;
  view_exists boolean;
BEGIN
  -- Check if viewer already viewed this profile today (to prevent spam)
  SELECT EXISTS(
    SELECT 1 FROM public.profile_view_logs
    WHERE provider_id = p_provider_id
    AND viewer_id = p_viewer_id
    AND viewed_at::date = CURRENT_DATE
  ) INTO view_exists;
  
  -- Only increment if not viewed today by same user, or if anonymous
  IF NOT view_exists OR p_viewer_id IS NULL THEN
    -- Increment profile views
    UPDATE public.provider_profiles
    SET profile_views = profile_views + 1
    WHERE id = p_provider_id
    RETURNING profile_views INTO new_views;
    
    -- Log the view
    INSERT INTO public.profile_view_logs (provider_id, viewer_id, viewer_ip, user_agent)
    VALUES (p_provider_id, p_viewer_id, p_viewer_ip, p_user_agent)
    ON CONFLICT (viewer_id, provider_id, viewed_at::date) DO NOTHING;
    
    RETURN new_views;
  ELSE
    -- Return current views without incrementing
    SELECT profile_views INTO new_views
    FROM public.provider_profiles
    WHERE id = p_provider_id;
    
    RETURN new_views;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_and_increment_profile_view TO anon;
GRANT EXECUTE ON FUNCTION public.log_and_increment_profile_view TO authenticated;
GRANT SELECT ON public.profile_view_logs TO authenticated;
GRANT INSERT ON public.profile_view_logs TO authenticated;

-- Add comment to document the function
COMMENT ON FUNCTION public.log_and_increment_profile_view IS 'Automatically increments profile views and logs the view. Prevents spam by tracking daily views per user.';
