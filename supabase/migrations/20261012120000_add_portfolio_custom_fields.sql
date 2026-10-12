ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.portfolio_items.custom_fields IS
  'Additional portfolio details keyed by the provider service category; existing portfolio columns remain unchanged.';
