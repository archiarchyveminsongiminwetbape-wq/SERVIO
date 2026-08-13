-- Add project_links JSONB column to portfolio_items for external project links

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS project_links jsonb NOT NULL DEFAULT '[]';

-- No special RLS needed: portfolio_items policies already allow owner updates/inserts

-- Optional: index for existence
CREATE INDEX IF NOT EXISTS idx_portfolio_project_links ON public.portfolio_items USING GIN (project_links);
