-- Add missing columns to bookings table for payment and metadata
-- Migration timestamp: 20260928100033

-- Add payment-related columns
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON public.bookings(payment_method);

-- Update currency default to XAF for this project
ALTER TABLE public.bookings 
ALTER COLUMN currency SET DEFAULT 'XAF';