-- Add availability_schedule column to provider_profiles
ALTER TABLE provider_profiles 
ADD COLUMN IF NOT EXISTS availability_schedule JSONB DEFAULT '{"monday":{"start":"09:00","end":"18:00","available":true},"tuesday":{"start":"09:00","end":"18:00","available":true},"wednesday":{"start":"09:00","end":"18:00","available":true},"thursday":{"start":"09:00","end":"18:00","available":true},"friday":{"start":"09:00","end":"18:00","available":true},"saturday":{"start":"09:00","end":"12:00","available":false},"sunday":{"start":"09:00","end":"12:00","available":false}}'::jsonb;

-- Add currency column to provider_profiles
ALTER TABLE provider_profiles 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';

-- Add payment_method column to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add payment_status column to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Create invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add client_id column to invoices if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN client_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add provider_id column to invoices if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'provider_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index on invoices
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_provider_id ON invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Create availability_slots table if it doesn't exist
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on availability_slots
CREATE INDEX IF NOT EXISTS idx_availability_slots_provider_id ON availability_slots(provider_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_date ON availability_slots(date);
CREATE INDEX IF NOT EXISTS idx_availability_slots_is_available ON availability_slots(is_available);

-- Add updated_at trigger for invoices
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists then create
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_availability_slots_updated_at ON availability_slots;
CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON availability_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
