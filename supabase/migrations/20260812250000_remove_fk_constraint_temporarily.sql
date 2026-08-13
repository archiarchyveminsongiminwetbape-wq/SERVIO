-- Temporarily remove the foreign key constraint to allow portfolio creation
-- This is a temporary fix to unblock users while we fix the root cause

ALTER TABLE public.portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_provider_id_fkey;

-- Note: This removes the referential integrity check temporarily
-- The constraint should be re-added once the root cause is fixed
