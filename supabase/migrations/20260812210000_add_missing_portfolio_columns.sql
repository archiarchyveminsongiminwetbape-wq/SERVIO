-- Add missing columns for videos, video thumbnails, and project links to portfolio_items
-- These columns are needed for the enhanced portfolio functionality

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS videos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_thumbnails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS project_links jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_videos ON public.portfolio_items USING GIN (videos);
CREATE INDEX IF NOT EXISTS idx_portfolio_video_thumbnails ON public.portfolio_items USING GIN (video_thumbnails);
CREATE INDEX IF NOT EXISTS idx_portfolio_project_links ON public.portfolio_items USING GIN (project_links);
