-- Partie 3: Fonctions et triggers pour le système d'escrow

-- Fonction pour mettre à jour updated_at (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_escrow_updated_at ON public.escrow_accounts;
CREATE TRIGGER update_escrow_updated_at BEFORE UPDATE ON public.escrow_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestones_updated_at ON public.milestones;
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_certifications_updated_at ON public.account_certifications;
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON public.account_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un escrow account après paiement
CREATE OR REPLACE FUNCTION create_escrow_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  escrow_id uuid;
BEGIN
  -- Créer un escrow account automatiquement quand un paiement est complété
  IF NEW.status = 'completed' AND NEW.booking_id IS NOT NULL THEN
    -- Vérifier si un escrow existe déjà pour ce booking
    IF NOT EXISTS (
      SELECT 1 FROM public.escrow_accounts 
      WHERE booking_id = NEW.booking_id
    ) THEN
      INSERT INTO public.escrow_accounts (
        booking_id,
        payment_id,
        total_amount,
        currency,
        amount_remaining,
        status,
        funded_at
      ) VALUES (
        NEW.booking_id,
        NEW.id,
        NEW.amount,
        NEW.currency,
        NEW.amount,
        'funded',
        now()
      ) RETURNING id INTO escrow_id;
      
      -- Créer des milestones par défaut (3 étapes: 30%, 40%, 30%)
      INSERT INTO public.milestones (escrow_id, title, description, percentage, amount) VALUES
        (escrow_id, 'Initial Payment', 'Premier paiement après début du travail', 30.0, NEW.amount * 0.30),
        (escrow_id, 'Progress Payment', 'Paiement intermédiaire après avancement', 40.0, NEW.amount * 0.40),
        (escrow_id, 'Final Payment', 'Paiement final après livraison complète', 30.0, NEW.amount * 0.30);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer escrow après paiement
DROP TRIGGER IF EXISTS trigger_create_escrow_after_payment ON public.payments;
CREATE TRIGGER trigger_create_escrow_after_payment
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION create_escrow_after_payment();

-- Fonction pour calculer le score de certification (appelable directement)
CREATE OR REPLACE FUNCTION update_certification_score(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_score integer := 0;
BEGIN
  -- Calculer le score basé sur les certifications approuvées
  SELECT COALESCE(SUM(
    CASE 
      WHEN certification_type = 'identity' AND status = 'approved' THEN 25
      WHEN certification_type = 'phone' AND status = 'approved' THEN 15
      WHEN certification_type = 'email' AND status = 'approved' THEN 10
      WHEN certification_type = 'address' AND status = 'approved' THEN 20
      WHEN certification_type = 'business' AND status = 'approved' THEN 20
      WHEN certification_type = 'provider' AND status = 'approved' THEN 10
      ELSE 0
    END
  ), 0) INTO v_score
  FROM public.account_certifications
  WHERE user_id = p_user_id;
  
  -- Mettre à jour le score dans chaque certification
  UPDATE public.account_certifications
  SET verification_score = v_score
  WHERE user_id = p_user_id;
  
  -- Déterminer le niveau de certification du profil
  UPDATE public.profiles
  SET 
    is_certified = (v_score >= 50),
    certification_level = CASE
      WHEN v_score >= 90 THEN 'premium'
      WHEN v_score >= 70 THEN 'verified'
      WHEN v_score >= 50 THEN 'standard'
      WHEN v_score >= 25 THEN 'basic'
      ELSE 'none'
    END,
    certification_date = CASE
      WHEN v_score >= 50 THEN COALESCE(certification_date, now())
      ELSE NULL
    END
  WHERE id = p_user_id;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Fonction trigger pour mettre à jour le score de certification
CREATE OR REPLACE FUNCTION trigger_update_certification_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_certification_score(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le score de certification
DROP TRIGGER IF EXISTS trigger_update_certification_score ON public.account_certifications;
CREATE TRIGGER trigger_update_certification_score
  AFTER INSERT OR UPDATE ON public.account_certifications
  FOR EACH ROW EXECUTE FUNCTION trigger_update_certification_score();

-- Fonction pour libérer des fonds d'escrow
CREATE OR REPLACE FUNCTION release_escrow_funds(p_escrow_id uuid, p_milestone_id uuid, p_admin_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_escrow_record public.escrow_accounts%ROWTYPE;
  v_milestone_record public.milestones%ROWTYPE;
  v_new_release_percentage numeric(5, 2);
  v_new_amount_released numeric(10, 2);
  v_new_amount_remaining numeric(10, 2);
BEGIN
  -- Récupérer les données
  SELECT * INTO v_escrow_record FROM public.escrow_accounts WHERE id = p_escrow_id;
  SELECT * INTO v_milestone_record FROM public.milestones WHERE id = p_milestone_id;
  
  -- Vérifications
  IF v_escrow_record.status NOT IN ('funded', 'partially_released') THEN
    RAISE EXCEPTION 'Escrow not in releasable state';
  END IF;
  
  IF v_milestone_record.status != 'approved' THEN
    RAISE EXCEPTION 'Milestone not approved';
  END IF;
  
  -- Calculer les nouveaux montants
  v_new_release_percentage := v_escrow_record.release_percentage + v_milestone_record.percentage;
  v_new_amount_released := v_escrow_record.amount_released + v_milestone_record.amount;
  v_new_amount_remaining := v_escrow_record.amount_remaining - v_milestone_record.amount;
  
  -- Mettre à jour l'escrow
  UPDATE public.escrow_accounts
  SET 
    release_percentage = v_new_release_percentage,
    amount_released = v_new_amount_released,
    amount_remaining = v_new_amount_remaining,
    status = CASE
      WHEN v_new_amount_remaining <= 0 THEN 'fully_released'
      ELSE 'partially_released'
    END,
    fully_released_at = CASE
      WHEN v_new_amount_remaining <= 0 THEN now()
      ELSE fully_released_at
    END,
    updated_at = now()
  WHERE id = p_escrow_id;
  
  -- Marquer le milestone comme payé
  UPDATE public.milestones
  SET 
    status = 'paid',
    paid_at = now(),
    payment_reference = 'ESCROW-' || p_escrow_id::text || '-' || p_milestone_id::text,
    updated_at = now()
  WHERE id = p_milestone_id;
  
  -- Retourner les détails
  RETURN jsonb_build_object(
    'success', true,
    'escrow_id', p_escrow_id,
    'milestone_id', p_milestone_id,
    'amount_released', v_milestone_record.amount,
    'total_released', v_new_amount_released,
    'total_remaining', v_new_amount_remaining,
    'release_percentage', v_new_release_percentage
  );
END;
$$ LANGUAGE plpgsql;
