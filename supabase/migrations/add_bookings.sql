-- Add bookings table for scheduling system

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  location_type text NOT NULL DEFAULT 'in_person', -- 'in_person', 'remote', 'hybrid'
  location_address text,
  notes text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
  price numeric(10, 2),
  currency text DEFAULT 'EUR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text
);

-- Create availability slots table for providers
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, date, start_time)
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
CREATE POLICY "bookings_select_client" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = client_id);

CREATE POLICY "bookings_select_provider" ON public.bookings
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles
      WHERE id = provider_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "bookings_select_admin" ON public.bookings
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "bookings_insert_client" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

CREATE POLICY "bookings_update_provider" ON public.bookings
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles
      WHERE id = provider_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "bookings_update_client" ON public.bookings
  FOR UPDATE TO authenticated USING (auth.uid() = client_id);

CREATE POLICY "bookings_update_admin" ON public.bookings
  FOR UPDATE TO authenticated USING (public.is_admin());

-- Create policies for availability slots
CREATE POLICY "availability_slots_select_provider" ON public.availability_slots
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles
      WHERE id = provider_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "availability_slots_select_all" ON public.availability_slots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "availability_slots_insert_provider" ON public.availability_slots
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.provider_profiles
      WHERE id = provider_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "availability_slots_update_provider" ON public.availability_slots
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles
      WHERE id = provider_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "availability_slots_delete_provider" ON public.availability_slots
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles
      WHERE id = provider_id AND user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX idx_bookings_scheduled_at ON public.bookings(scheduled_at);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_availability_slots_provider_id ON public.availability_slots(provider_id);
CREATE INDEX idx_availability_slots_date ON public.availability_slots(date);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_slots TO authenticated;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON public.availability_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
