-- Improve portfolio view tracking with anti-spam protection
-- Returns the new view count and prevents spam from same user on same day

-- Update the increment_portfolio_views function to return the count
CREATE OR REPLACE FUNCTION public.increment_portfolio_views(item_id uuid, viewer_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_views integer;
  view_exists boolean;
BEGIN
  -- Check if viewer already viewed this portfolio item today
  SELECT EXISTS(
    SELECT 1 FROM public.portfolio_view_logs
    WHERE item_id = item_id
    AND viewer_id = viewer_id
    AND viewed_at::date = CURRENT_DATE
  ) INTO view_exists;
  
  -- Only increment if not viewed today by same user, or if anonymous
  IF NOT view_exists OR viewer_id IS NULL THEN
    -- Increment portfolio views
    UPDATE public.portfolio_items
    SET views = COALESCE(views, 0) + 1
    WHERE id = item_id
    RETURNING views INTO new_views;
    
    -- Log the view
    INSERT INTO public.portfolio_view_logs (item_id, viewer_id, viewer_ip, user_agent)
    VALUES (item_id, viewer_id, NULL, NULL)
    ON CONFLICT (viewer_id, item_id, viewed_at::date) DO NOTHING;
    
    RETURN new_views;
  ELSE
    -- Return current views without incrementing
    SELECT views INTO new_views
    FROM public.portfolio_items
    WHERE id = item_id;
    
    RETURN new_views;
  END IF;
END;
$$;

-- Create portfolio view logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.portfolio_view_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewer_ip TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(viewer_id, item_id, viewed_at::date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_view_logs_item_id ON public.portfolio_view_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_view_logs_viewer_id ON public.portfolio_view_logs(viewer_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_view_logs_viewed_at ON public.portfolio_view_logs(viewed_at DESC);

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.increment_portfolio_views TO anon;
GRANT EXECUTE ON FUNCTION public.increment_portfolio_views TO authenticated;
GRANT SELECT ON public.portfolio_view_logs TO authenticated;
GRANT INSERT ON public.portfolio_view_logs TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.increment_portfolio_views IS 'Automatically increments portfolio views with anti-spam protection. Returns new view count.';
