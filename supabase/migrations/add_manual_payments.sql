-- Table pour les paiements manuels (remplacement de Flutterwave)

CREATE TABLE IF NOT EXISTS public.manual_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_ref text UNIQUE NOT NULL,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'XAF',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected', 'cancelled'
  payment_method text NOT NULL DEFAULT 'manual', -- 'orange_money', 'mtn_money', 'wave', 'bank_transfer', 'cash', 'check'
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_notes text,
  evidence_urls text[], -- Preuves de paiement (reçus, captures d'écran)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejected_at timestamptz,
  rejected_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason text
);

-- Activer RLS
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour manual_payments
DROP POLICY IF EXISTS "manual_payments_select_user" ON public.manual_payments;
CREATE POLICY "manual_payments_select_user" ON public.manual_payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "manual_payments_select_admin" ON public.manual_payments;
CREATE POLICY "manual_payments_select_admin" ON public.manual_payments
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "manual_payments_insert_user" ON public.manual_payments;
CREATE POLICY "manual_payments_insert_user" ON public.manual_payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "manual_payments_update_admin" ON public.manual_payments;
CREATE POLICY "manual_payments_update_admin" ON public.manual_payments
  FOR UPDATE TO authenticated USING (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manual_payments_booking_id ON public.manual_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_user_id ON public.manual_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON public.manual_payments(status);
CREATE INDEX IF NOT EXISTS idx_manual_payments_tx_ref ON public.manual_payments(tx_ref);

-- Permissions
GRANT SELECT, INSERT ON public.manual_payments TO authenticated;
GRANT SELECT, UPDATE ON public.manual_payments TO authenticated;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_manual_payments_updated_at ON public.manual_payments;
CREATE TRIGGER update_manual_payments_updated_at BEFORE UPDATE ON public.manual_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer un paiement manuel après création de booking
CREATE OR REPLACE FUNCTION create_manual_payment_after_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_tx_ref text;
BEGIN
  -- Créer un paiement manuel automatiquement quand un booking est créé
  IF NEW.status = 'pending' AND NEW.price IS NOT NULL THEN
    -- Générer une référence unique
    v_tx_ref := 'MANUAL-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(md5(random()::text), 1, 8);
    
    -- Créer le paiement manuel
    INSERT INTO public.manual_payments (
      tx_ref,
      amount,
      currency,
      status,
      payment_method,
      customer_email,
      customer_name,
      booking_id,
      user_id
    ) SELECT
      v_tx_ref,
      NEW.price,
      NEW.currency,
      'pending',
      'manual',
      u.email,
      u.full_name,
      NEW.id,
      NEW.client_id
    FROM public.profiles u
    WHERE u.id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer paiement manuel après booking
DROP TRIGGER IF EXISTS trigger_create_manual_payment_after_booking ON public.bookings;
CREATE TRIGGER trigger_create_manual_payment_after_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION create_manual_payment_after_booking();
