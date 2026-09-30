-- Update permissions for new booking columns
-- Migration timestamp: 20260928100034

-- Ensure authenticated users can use the new columns
ALTER TABLE public.bookings 
ALTER COLUMN payment_method SET DEFAULT 'cash',
ALTER COLUMN payment_status SET DEFAULT 'pending';

-- Grant permissions on the new columns
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;