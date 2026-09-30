-- Partie 1: Création des tables de base du système d'escrow

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

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_escrow_booking_id ON public.escrow_accounts(booking_id);
CREATE INDEX IF NOT EXISTS idx_escrow_payment_id ON public.escrow_accounts(payment_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON public.escrow_accounts(status);
CREATE INDEX IF NOT EXISTS idx_milestones_escrow_id ON public.milestones(escrow_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON public.account_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON public.account_certifications(status);
CREATE INDEX IF NOT EXISTS idx_certifications_type ON public.account_certifications(certification_type);

-- 9. Permissions
GRANT SELECT, INSERT, UPDATE ON public.escrow_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.milestones TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.account_certifications TO authenticated;
