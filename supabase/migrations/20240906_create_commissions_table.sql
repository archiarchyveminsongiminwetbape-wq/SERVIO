-- Table pour les commissions sur les prestations
CREATE TABLE IF NOT EXISTS commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.15, -- 15% par défaut
  commission_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'calculated', 'withheld', 'released', 'refunded')),
  withheld_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10, 2),
  refund_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_commissions_booking ON commissions(booking_id);
CREATE INDEX IF NOT EXISTS idx_commissions_provider ON commissions(provider_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Politique RLS
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux admins de voir toutes les commissions
CREATE POLICY "Admins can view all commissions"
  ON commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique pour permettre aux prestataires de voir leurs commissions
CREATE POLICY "Providers can view their own commissions"
  ON commissions FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM provider_profiles WHERE user_id = auth.uid()
    )
  );

-- Politique pour permettre aux admins de créer/mettre à jour les commissions
CREATE POLICY "Admins can manage commissions"
  ON commissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Fonction pour calculer automatiquement la commission lors de la création d'une réservation
CREATE OR REPLACE FUNCTION calculate_commission_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  commission_rate_val DECIMAL(5, 2);
  commission_amount_val DECIMAL(10, 2);
BEGIN
  -- Déterminer le taux de commission selon le plan d'abonnement
  SELECT COALESCE(
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM subscriptions 
        WHERE user_id = (SELECT user_id FROM provider_profiles WHERE id = NEW.provider_id)
        AND plan = 'pro'
        AND status = 'active'
      ) THEN 0.10 -- 10% pour les PRO
      ELSE 0.15 -- 15% standard
    END,
    0.15
  ) INTO commission_rate_val;

  -- Calculer le montant de la commission
  commission_amount_val := NEW.total_amount * commission_rate_val;

  -- Créer l'enregistrement de commission
  INSERT INTO commissions (
    booking_id,
    provider_id,
    amount,
    commission_rate,
    commission_amount,
    status
  ) VALUES (
    NEW.id,
    NEW.provider_id,
    NEW.total_amount,
    commission_rate_val,
    commission_amount_val,
    'calculated'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer la commission automatiquement
CREATE TRIGGER trigger_calculate_commission
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_commission_on_booking();
