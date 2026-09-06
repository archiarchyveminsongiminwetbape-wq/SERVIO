-- Mettre à jour le système d'abonnement pour les avantages PRO
-- Plan PRO: taux de commission réduit (10% au lieu de 15%)
-- Avantages supplémentaires: mise en avant, badge premium, analytics avancés

-- Mettre à jour la table subscriptions pour inclure les avantages
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '{}';

-- Mettre à jour les abonnements PRO existants avec les avantages de base
UPDATE subscriptions 
SET benefits = jsonb_build_object(
  'commission_rate', 0.10,
  'featured_listing', true,
  'premium_badge', true,
  'advanced_analytics', true,
  'priority_support', true,
  'unlimited_portfolio', true
)
WHERE plan = 'pro' AND status = 'active';

-- Créer une fonction pour vérifier si un prestataire a les avantages PRO
CREATE OR REPLACE FUNCTION get_provider_benefits(provider_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  benefits JSONB;
BEGIN
  SELECT COALESCE(s.benefits, '{}'::jsonb)
  INTO benefits
  FROM subscriptions s
  WHERE s.user_id = provider_user_id
  AND s.plan = 'pro'
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  RETURN benefits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction de calcul de commission pour utiliser le taux PRO
CREATE OR REPLACE FUNCTION calculate_commission_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  commission_rate_val DECIMAL(5, 2);
  commission_amount_val DECIMAL(10, 2);
  provider_benefits JSONB;
BEGIN
  -- Obtenir les avantages du prestataire
  SELECT get_provider_benefits(pp.user_id)
  INTO provider_benefits
  FROM provider_profiles pp
  WHERE pp.id = NEW.provider_id;
  
  -- Déterminer le taux de commission selon les avantages
  IF provider_benefits ? 'commission_rate' THEN
    commission_rate_val := (provider_benefits->>'commission_rate')::DECIMAL(5, 2);
  ELSE
    commission_rate_val := 0.15; -- 15% standard
  END IF;
  
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

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_calculate_commission ON bookings;
CREATE TRIGGER trigger_calculate_commission
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_commission_on_booking();

-- Table pour les mises en avant (featured listings)
CREATE TABLE IF NOT EXISTS featured_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  listing_position INTEGER NOT NULL, -- Position dans la liste (1 = premier)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index pour les featured listings
CREATE INDEX IF NOT EXISTS idx_featured_listings_provider ON featured_listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_featured_listings_dates ON featured_listings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_featured_listings_status ON featured_listings(status);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_featured_listings_updated_at
  BEFORE UPDATE ON featured_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Politique RLS pour featured_listings
ALTER TABLE featured_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage featured listings"
  ON featured_listings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Providers can view their own featured listings"
  ON featured_listings FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM provider_profiles WHERE user_id = auth.uid()
    )
  );

-- Fonction pour obtenir les prestataires mis en avant actifs
CREATE OR REPLACE FUNCTION get_featured_providers()
RETURNS TABLE (
  provider_id UUID,
  business_name TEXT,
  avatar_url TEXT,
  rating_avg DECIMAL(3, 2),
  listing_position INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fl.provider_id,
    pp.business_name,
    pp.avatar_url,
    pp.rating_avg,
    fl.listing_position
  FROM featured_listings fl
  JOIN provider_profiles pp ON fl.provider_id = pp.id
  WHERE fl.status = 'active'
  AND fl.start_date <= NOW()
  AND fl.end_date > NOW()
  AND pp.validation_status = 'approved'
  ORDER BY fl.listing_position ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
