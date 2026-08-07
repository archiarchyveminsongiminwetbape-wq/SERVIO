/*
# SERVIO — Add Video Support to Portfolio Items

## Overview
Adds video support to portfolio_items table to allow providers to showcase their work
with short videos (max 20 seconds).

## New Fields
- videos: Array of video URLs for portfolio items
- video_thumbnails: Array of thumbnail URLs for videos
*/

-- Add new columns to portfolio_items
ALTER TABLE public.portfolio_items
ADD COLUMN IF NOT EXISTS videos text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS video_thumbnails text[] NOT NULL DEFAULT '{}';

-- Create index for items with videos
CREATE INDEX IF NOT EXISTS idx_portfolio_videos ON public.portfolio_items(id) WHERE array_length(videos, 1) > 0;
