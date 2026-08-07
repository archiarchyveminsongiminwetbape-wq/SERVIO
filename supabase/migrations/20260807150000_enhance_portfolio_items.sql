/*
# SERVIO — Enhance Portfolio Items

## Overview
Adds additional fields to portfolio_items table to allow richer information about projects.
Also ensures provider profile photos are visible in portfolio display.

## New Fields
- client_name: Name of the client for whom the project was completed
- project_date: Date when the project was completed
- budget: Project budget range
- location: Project location
- featured: Whether to feature this project
- technologies_used: Technologies/skills used for the project
- duration: Project duration (e.g., "2 weeks", "1 month")
- team_size: Number of team members involved
*/

-- Add new columns to portfolio_items
ALTER TABLE public.portfolio_items
ADD COLUMN IF NOT EXISTS client_name text,
ADD COLUMN IF NOT EXISTS project_date date,
ADD COLUMN IF NOT EXISTS budget text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS technologies_used text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS duration text,
ADD COLUMN IF NOT EXISTS team_size int;

-- Create index for featured items
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON public.portfolio_items(featured) WHERE featured = true;
