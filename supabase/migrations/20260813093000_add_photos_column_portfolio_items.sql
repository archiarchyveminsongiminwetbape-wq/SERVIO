-- Ensure `photos` column exists on portfolio_items
-- Adds a text[] photos column with default empty array if missing.

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}';

-- Create index to speed up queries that read the first photo or check array length
CREATE INDEX IF NOT EXISTS idx_portfolio_photos ON public.portfolio_items USING GIN (photos);
