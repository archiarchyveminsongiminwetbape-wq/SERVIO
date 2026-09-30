-- Système d'Escrow (Compte Séquestre) pour SERVIO
-- Permet de bloquer les fonds jusqu'à validation manuelle par l'admin
-- Supporte les paiements progressifs par milestones/jalons

-- 1. Ajouter payment_status à la table bookings si non existant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;
END $$;

-- 2. Créer la table escrow_accounts
CREATE TABLE IF NOT EXISTS public.escrow_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  total_amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'XAF',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'funded', 'partially_released', 'fully_released', 'refunded'
  release_percentage numeric(5, 2) DEFAULT 0, -- Pourcentage déjà libéré (0-100)
  amount_released numeric(10, 2) DEFAULT 0, -- Montant déjà libéré
  amount_remaining numeric(10, 2) NOT NULL, -- Montant restant à libérer
  admin_notes text,
  funded_at timestamptz,
  fully_released_at timestamptz,
  refunded_at timestamptz,
  refund_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Créer la table milestones pour les paiements progressifs
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id uuid NOT NULL REFERENCES public.escrow_accounts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  percentage numeric(5, 2) NOT NULL, -- Pourcentage du montant total (ex: 25%)
  amount numeric(10, 2) NOT NULL, -- Montant calculé automatiquement
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'approved', 'rejected', 'paid'
  due_date timestamptz,
  completed_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejected_at timestamptz,
  rejected_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason text,
  paid_at timestamptz,
  payment_reference text,
  evidence_urls text[], -- URLs des preuves de travail (images, documents)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (percentage > 0 AND percentage <= 100),
  CHECK (amount >= 0)
);

-- 4. Créer la table account_certifications pour la certification des comptes
CREATE TABLE IF NOT EXISTS public.account_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certification_type text NOT NULL, -- 'identity', 'phone', 'email', 'address', 'business', 'provider'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'under_review', 'approved', 'rejected'
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason text,
  evidence_data jsonb DEFAULT '{}', -- Données de preuve (documents, infos)
  expiry_date timestamptz,
  is_verified boolean DEFAULT false,
  verification_score integer DEFAULT 0, -- Score de confiance (0-100)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, certification_type)
);

-- 5. Ajouter des colonnes à profiles pour le statut de certification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_certified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_certified boolean DEFAULT false;
    ALTER TABLE public.profiles ADD COLUMN certification_level text DEFAULT 'none'; -- 'none', 'basic', 'standard', 'verified', 'premium'
    ALTER TABLE public.profiles ADD COLUMN certification_date timestamptz;
  END IF;
END $$;

-- 6. Ajouter des colonnes à provider_profiles pour la certification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'provider_profiles' AND column_name = 'is_certified'
  ) THEN
    ALTER TABLE public.provider_profiles ADD COLUMN is_certified boolean DEFAULT false;
    ALTER TABLE public.provider_profiles ADD COLUMN certification_level text DEFAULT 'none';
    ALTER TABLE public.provider_profiles ADD COLUMN certification_date timestamptz;
    ALTER TABLE public.provider_profiles ADD COLUMN escrow_enabled boolean DEFAULT true; -- Activer escrow par défaut
  END IF;
END $$;

-- 7. Activer RLS
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_certifications ENABLE ROW LEVEL SECURITY;

-- 8. Politiques RLS pour escrow_accounts
DROP POLICY IF EXISTS "escrow_select_admin" ON public.escrow_accounts;
CREATE POLICY "escrow_select_admin" ON public.escrow_accounts
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "escrow_select_client" ON public.escrow_accounts;
CREATE POLICY "escrow_select_client" ON public.escrow_accounts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = escrow_accounts.booking_id AND b.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "escrow_select_provider" ON public.escrow_accounts;
CREATE POLICY "escrow_select_provider" ON public.escrow_accounts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.provider_profiles pp ON pp.id = b.provider_id
      WHERE b.id = escrow_accounts.booking_id AND pp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "escrow_insert_admin" ON public.escrow_accounts;
CREATE POLICY "escrow_insert_admin" ON public.escrow_accounts
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "escrow_update_admin" ON public.escrow_accounts;
CREATE POLICY "escrow_update_admin" ON public.escrow_accounts
  FOR UPDATE TO authenticated USING (public.is_admin());

-- 9. Politiques RLS pour milestones
DROP POLICY IF EXISTS "milestones_select_admin" ON public.milestones;
CREATE POLICY "milestones_select_admin" ON public.milestones
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "milestones_select_client" ON public.milestones;
CREATE POLICY "milestones_select_client" ON public.milestones
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.escrow_accounts ea
      JOIN public.bookings b ON b.id = ea.booking_id
      WHERE ea.id = milestones.escrow_id AND b.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "milestones_select_provider" ON public.milestones;
CREATE POLICY "milestones_select_provider" ON public.milestones
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.escrow_accounts ea
      JOIN public.bookings b ON b.id = ea.booking_id
      JOIN public.provider_profiles pp ON pp.id = b.provider_id
      WHERE ea.id = milestones.escrow_id AND pp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "milestones_insert_admin" ON public.milestones;
CREATE POLICY "milestones_insert_admin" ON public.milestones
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "milestones_update_admin" ON public.milestones;
CREATE POLICY "milestones_update_admin" ON public.milestones
  FOR UPDATE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "milestones_update_provider" ON public.milestones;
CREATE POLICY "milestones_update_provider" ON public.milestones
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.escrow_accounts ea
      JOIN public.bookings b ON b.id = ea.booking_id
      JOIN public.provider_profiles pp ON pp.id = b.provider_id
      WHERE ea.id = milestones.escrow_id AND pp.user_id = auth.uid()
    )
  ) WITH CHECK (
    -- Provider peut seulement marquer comme completed (soumettre preuves)
    (NEW.status = 'completed' AND OLD.status = 'pending') OR
    (public.is_admin())
  );

-- 10. Politiques RLS pour account_certifications
DROP POLICY IF EXISTS "certifications_select_user" ON public.account_certifications;
CREATE POLICY "certifications_select_user" ON public.account_certifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "certifications_select_admin" ON public.account_certifications;
CREATE POLICY "certifications_select_admin" ON public.account_certifications
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "certifications_insert_user" ON public.account_certifications;
CREATE POLICY "certifications_insert_user" ON public.account_certifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "certifications_update_user" ON public.account_certifications;
CREATE POLICY "certifications_update_user" ON public.account_certifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "certifications_update_admin" ON public.account_certifications;
CREATE POLICY "certifications_update_admin" ON public.account_certifications
  FOR UPDATE TO authenticated USING (public.is_admin());

-- 11. Indexes
CREATE INDEX IF NOT EXISTS idx_escrow_booking_id ON public.escrow_accounts(booking_id);
CREATE INDEX IF NOT EXISTS idx_escrow_payment_id ON public.escrow_accounts(payment_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON public.escrow_accounts(status);
CREATE INDEX IF NOT EXISTS idx_milestones_escrow_id ON public.milestones(escrow_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON public.account_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON public.account_certifications(status);
CREATE INDEX IF NOT EXISTS idx_certifications_type ON public.account_certifications(certification_type);

-- 12. Permissions
GRANT SELECT, INSERT, UPDATE ON public.escrow_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.milestones TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.account_certifications TO authenticated;

-- 13. Triggers pour updated_at
DROP TRIGGER IF EXISTS update_escrow_updated_at ON public.escrow_accounts;
CREATE TRIGGER update_escrow_updated_at BEFORE UPDATE ON public.escrow_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestones_updated_at ON public.milestones;
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_certifications_updated_at ON public.account_certifications;
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON public.account_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Fonction pour créer automatiquement un escrow account après paiement
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

-- 15. Trigger pour créer escrow après paiement
DROP TRIGGER IF EXISTS trigger_create_escrow_after_payment ON public.payments;
CREATE TRIGGER trigger_create_escrow_after_payment
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION create_escrow_after_payment();

-- 16. Fonction pour calculer le score de certification
CREATE OR REPLACE FUNCTION update_certification_score(user_id uuid)
RETURNS integer AS $$
DECLARE
  score integer := 0;
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
  ), 0) INTO score
  FROM public.account_certifications
  WHERE user_id = account_certifications.user_id;
  
  -- Mettre à jour le score dans chaque certification
  UPDATE public.account_certifications
  SET verification_score = score
  WHERE user_id = account_certifications.user_id;
  
  -- Déterminer le niveau de certification du profil
  UPDATE public.profiles
  SET 
    is_certified = (score >= 50),
    certification_level = CASE
      WHEN score >= 90 THEN 'premium'
      WHEN score >= 70 THEN 'verified'
      WHEN score >= 50 THEN 'standard'
      WHEN score >= 25 THEN 'basic'
      ELSE 'none'
    END,
    certification_date = CASE
      WHEN score >= 50 THEN COALESCE(certification_date, now())
      ELSE NULL
    END
  WHERE id = user_id;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- 17. Trigger pour mettre à jour le score de certification
CREATE OR REPLACE FUNCTION trigger_update_certification_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_certification_score(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_certification_score ON public.account_certifications;
CREATE TRIGGER trigger_update_certification_score
  AFTER INSERT OR UPDATE ON public.account_certifications
  FOR EACH ROW EXECUTE FUNCTION trigger_update_certification_score();

-- 18. Fonction pour libérer des fonds d'escrow
CREATE OR REPLACE FUNCTION release_escrow_funds(escrow_id uuid, milestone_id uuid, admin_id uuid)
RETURNS jsonb AS $$
DECLARE
  escrow_record public.escrow_accounts%ROWTYPE;
  milestone_record public.milestones%ROWTYPE;
  new_release_percentage numeric(5, 2);
  new_amount_released numeric(10, 2);
  new_amount_remaining numeric(10, 2);
BEGIN
  -- Récupérer les données
  SELECT * INTO escrow_record FROM public.escrow_accounts WHERE id = escrow_id;
  SELECT * INTO milestone_record FROM public.milestones WHERE id = milestone_id;
  
  -- Vérifications
  IF escrow_record.status NOT IN ('funded', 'partially_released') THEN
    RAISE EXCEPTION 'Escrow not in releasable state';
  END IF;
  
  IF milestone_record.status != 'approved' THEN
    RAISE EXCEPTION 'Milestone not approved';
  END IF;
  
  -- Calculer les nouveaux montants
  new_release_percentage := escrow_record.release_percentage + milestone_record.percentage;
  new_amount_released := escrow_record.amount_released + milestone_record.amount;
  new_amount_remaining := escrow_record.amount_remaining - milestone_record.amount;
  
  -- Mettre à jour l'escrow
  UPDATE public.escrow_accounts
  SET 
    release_percentage = new_release_percentage,
    amount_released = new_amount_released,
    amount_remaining = new_amount_remaining,
    status = CASE
      WHEN new_amount_remaining <= 0 THEN 'fully_released'
      ELSE 'partially_released'
    END,
    fully_released_at = CASE
      WHEN new_amount_remaining <= 0 THEN now()
      ELSE fully_released_at
    END,
    updated_at = now()
  WHERE id = escrow_id;
  
  -- Marquer le milestone comme payé
  UPDATE public.milestones
  SET 
    status = 'paid',
    paid_at = now(),
    payment_reference = 'ESCROW-' || escrow_id::text || '-' || milestone_id::text,
    updated_at = now()
  WHERE id = milestone_id;
  
  -- Retourner les détails
  RETURN jsonb_build_object(
    'success', true,
    'escrow_id', escrow_id,
    'milestone_id', milestone_id,
    'amount_released', milestone_record.amount,
    'total_released', new_amount_released,
    'total_remaining', new_amount_remaining,
    'release_percentage', new_release_percentage
  );
END;
$$ LANGUAGE plpgsql;
