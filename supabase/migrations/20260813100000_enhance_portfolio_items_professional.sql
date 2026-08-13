-- Enhance portfolio_items table with professional portfolio elements
-- Adds fields for context, objective, role, process, and result

-- Add new columns to portfolio_items table
ALTER TABLE public.portfolio_items
ADD COLUMN IF NOT EXISTS context TEXT, -- Problématique, brief, contraintes
ADD COLUMN IF NOT EXISTS objective TEXT, -- Ce qu'il fallait accomplir
ADD COLUMN IF NOT EXISTS role TEXT, -- Votre contribution exacte
ADD COLUMN IF NOT EXISTS process TEXT, -- Méthodologie, outils, étapes clés
ADD COLUMN IF NOT EXISTS result TEXT; -- Livrable final, impact mesurable

-- Create index for searching portfolio items by role and skills
CREATE INDEX IF NOT EXISTS idx_portfolio_role ON public.portfolio_items(role);
CREATE INDEX IF NOT EXISTS idx_portfolio_technologies ON public.portfolio_items USING GIN (technologies_used);

-- Add comments for documentation
COMMENT ON COLUMN public.portfolio_items.context IS 'Project context, brief, and constraints';
COMMENT ON COLUMN public.portfolio_items.objective IS 'Project objective - what had to be accomplished';
COMMENT ON COLUMN public.portfolio_items.role IS 'Provider''s exact contribution and role in project';
COMMENT ON COLUMN public.portfolio_items.process IS 'Methodology, tools used, and key steps';
COMMENT ON COLUMN public.portfolio_items.result IS 'Final deliverable and measurable impact (KPIs, numbers, feedback)';
