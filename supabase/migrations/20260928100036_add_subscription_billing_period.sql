-- Add billing_period and benefits columns to subscriptions table
-- This migration adds support for quarterly and yearly billing periods,
-- and stores subscription benefits as JSONB

ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'quarterly', 'yearly')),
ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '{}';

-- Create index on billing_period for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_period ON public.subscriptions(billing_period);

-- Create GIN index on benefits for JSONB queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_benefits ON public.subscriptions USING GIN (benefits);

-- Add comment to document the new columns
COMMENT ON COLUMN public.subscriptions.billing_period IS 'Billing period: monthly, quarterly, or yearly';
COMMENT ON COLUMN public.subscriptions.benefits IS 'Subscription benefits stored as JSONB (commission_rate, featured_listing, premium_badge, etc.)';
