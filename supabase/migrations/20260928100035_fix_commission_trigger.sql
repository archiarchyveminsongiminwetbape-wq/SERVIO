-- Fix commission trigger to use 'price' instead of 'total_amount'
-- Migration timestamp: 20260928100035

-- Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.bookings;

-- Update the function to use 'price' instead of 'total_amount'
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
  commission_amount_val := NEW.price * commission_rate_val;

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
    NEW.price,
    commission_rate_val,
    commission_amount_val,
    'calculated'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_calculate_commission
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_commission_on_booking();