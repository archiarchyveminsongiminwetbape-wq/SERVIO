-- Table pour les informations bancaires des prestataires (pour virements automatiques)

CREATE TABLE IF NOT EXISTS public.provider_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'mobile_money', -- 'mobile_money', 'bank_account'
  provider text NOT NULL, -- 'orange_money', 'mtn_money', 'wave', 'bank'
  account_number text NOT NULL,
  account_name text NOT NULL,
  bank_code text, -- Code bancaire si compte bancaire
  currency text NOT NULL DEFAULT 'XAF',
  country_code text NOT NULL DEFAULT 'CM', -- Code pays (CM: Cameroun, SN: Sénégal, etc.)
  is_primary boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  verification_data jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE(provider_id, account_number)
);

-- Table pour les transactions de virement
CREATE TABLE IF NOT EXISTS public.transfer_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id uuid REFERENCES public.escrow_accounts(id) ON DELETE SET NULL,
  milestone_id uuid REFERENCES public.milestones(id) ON DELETE SET NULL,
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  bank_account_id uuid REFERENCES public.provider_bank_accounts(id) ON DELETE SET NULL,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'XAF',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'reversed'
  reference text UNIQUE NOT NULL,
  flutterwave_reference text,
  flutterwave_response jsonb DEFAULT '{}',
  error_message text,
  initiated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  failed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.provider_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_transactions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour provider_bank_accounts
DROP POLICY IF EXISTS "bank_accounts_select_provider" ON public.provider_bank_accounts;
CREATE POLICY "bank_accounts_select_provider" ON public.provider_bank_accounts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles
      WHERE id = provider_bank_accounts.provider_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "bank_accounts_select_admin" ON public.provider_bank_accounts;
CREATE POLICY "bank_accounts_select_admin" ON public.provider_bank_accounts
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "bank_accounts_insert_provider" ON public.provider_bank_accounts;
CREATE POLICY "bank_accounts_insert_provider" ON public.provider_bank_accounts
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.provider_profiles
      WHERE id = provider_bank_accounts.provider_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "bank_accounts_update_provider" ON public.provider_bank_accounts;
CREATE POLICY "bank_accounts_update_provider" ON public.provider_bank_accounts
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles
      WHERE id = provider_bank_accounts.provider_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "bank_accounts_delete_provider" ON public.provider_bank_accounts;
CREATE POLICY "bank_accounts_delete_provider" ON public.provider_bank_accounts
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles
      WHERE id = provider_bank_accounts.provider_id AND user_id = auth.uid()
    )
  );

-- Politiques RLS pour transfer_transactions
DROP POLICY IF EXISTS "transfers_select_provider" ON public.transfer_transactions;
CREATE POLICY "transfers_select_provider" ON public.transfer_transactions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles
      WHERE id = transfer_transactions.provider_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "transfers_select_admin" ON public.transfer_transactions;
CREATE POLICY "transfers_select_admin" ON public.transfer_transactions
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "transfers_insert_admin" ON public.transfer_transactions;
CREATE POLICY "transfers_insert_admin" ON public.transfer_transactions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "transfers_update_admin" ON public.transfer_transactions;
CREATE POLICY "transfers_update_admin" ON public.transfer_transactions
  FOR UPDATE TO authenticated USING (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bank_accounts_provider_id ON public.provider_bank_accounts(provider_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_provider ON public.provider_bank_accounts(provider, account_number);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_primary ON public.provider_bank_accounts(is_primary);
CREATE INDEX IF NOT EXISTS idx_transfers_provider_id ON public.transfer_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_transfers_escrow_id ON public.transfer_transactions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_transfers_milestone_id ON public.transfer_transactions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.transfer_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transfers_reference ON public.transfer_transactions(reference);

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_bank_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.transfer_transactions TO authenticated;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON public.provider_bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.provider_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transfers_updated_at ON public.transfer_transactions;
CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON public.transfer_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer une référence de virement unique
CREATE OR REPLACE FUNCTION generate_transfer_reference()
RETURNS text AS $$
BEGIN
  RETURN 'TRF-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour initier un virement automatique
CREATE OR REPLACE FUNCTION initiate_automatic_transfer(
  p_escrow_id uuid,
  p_milestone_id uuid,
  p_admin_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_escrow RECORD;
  v_milestone RECORD;
  v_provider_id uuid;
  v_bank_account RECORD;
  v_transfer_reference text;
  v_transfer_id uuid;
BEGIN
  -- Récupérer les données de l'escrow et du milestone
  SELECT * INTO v_escrow FROM public.escrow_accounts WHERE id = p_escrow_id;
  SELECT * INTO v_milestone FROM public.milestones WHERE id = p_milestone_id;
  
  IF v_escrow IS NULL OR v_milestone IS NULL THEN
    RAISE EXCEPTION 'Escrow or milestone not found';
  END IF;
  
  -- Récupérer l'ID du provider
  SELECT 
    b.provider_id 
  INTO v_provider_id
  FROM public.bookings b
  WHERE b.id = v_escrow.booking_id;
  
  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'Provider not found for this booking';
  END IF;
  
  -- Récupérer le compte bancaire principal du provider
  SELECT * INTO v_bank_account
  FROM public.provider_bank_accounts
  WHERE provider_id = v_provider_id AND is_primary = true AND is_verified = true
  LIMIT 1;
  
  IF v_bank_account IS NULL THEN
    -- Si pas de compte principal, prendre le premier vérifié
    SELECT * INTO v_bank_account
    FROM public.provider_bank_accounts
    WHERE provider_id = v_provider_id AND is_verified = true
    LIMIT 1;
  END IF;
  
  IF v_bank_account IS NULL THEN
    RAISE EXCEPTION 'No verified bank account found for provider';
  END IF;
  
  -- Générer une référence de virement
  v_transfer_reference := generate_transfer_reference();
  
  -- Créer l'enregistrement de transfert
  INSERT INTO public.transfer_transactions (
    escrow_id,
    milestone_id,
    provider_id,
    bank_account_id,
    amount,
    currency,
    status,
    reference,
    initiated_at
  ) VALUES (
    p_escrow_id,
    p_milestone_id,
    v_provider_id,
    v_bank_account.id,
    v_milestone.amount,
    v_escrow.currency,
    'pending',
    v_transfer_reference,
    now()
  ) RETURNING id INTO v_transfer_id;
  
  -- Retourner les détails pour traitement ultérieur
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'reference', v_transfer_reference,
    'amount', v_milestone.amount,
    'currency', v_escrow.currency,
    'provider_id', v_provider_id,
    'bank_account_id', v_bank_account.id,
    'account_number', v_bank_account.account_number,
    'account_type', v_bank_account.account_type,
    'provider', v_bank_account.provider
  );
END;
$$ LANGUAGE plpgsql;
