-- Table pour enregistrer les transferts automatiques (Orange Money, etc.)

CREATE TABLE IF NOT EXISTS public.transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id uuid REFERENCES public.escrow_accounts(id) ON DELETE SET NULL,
  milestone_id uuid REFERENCES public.milestones(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES public.provider_profiles(id) ON DELETE SET NULL,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'XAF',
  transfer_id text, -- ID du transfert chez le fournisseur de paiement (Flutterwave)
  reference text UNIQUE NOT NULL, -- Référence unique SERVIO
  status text NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed', 'cancelled'
  initiated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  beneficiary_name text NOT NULL,
  beneficiary_account text NOT NULL, -- Numéro de téléphone Orange Money
  bank_code text NOT NULL, -- Code bancaire (OR pour Orange Money)
  provider_response jsonb DEFAULT '{}', -- Réponse du fournisseur de paiement
  error_message text,
  processed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (amount > 0)
);

-- Activer RLS
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour transfers
DROP POLICY IF EXISTS "transfers_select_admin" ON public.transfers;
CREATE POLICY "transfers_select_admin" ON public.transfers
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "transfers_select_provider" ON public.transfers;
CREATE POLICY "transfers_select_provider" ON public.transfers
  FOR SELECT TO authenticated USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "transfers_insert_admin" ON public.transfers;
CREATE POLICY "transfers_insert_admin" ON public.transfers
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "transfers_update_admin" ON public.transfers;
CREATE POLICY "transfers_update_admin" ON public.transfers
  FOR UPDATE TO authenticated USING (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transfers_escrow_id ON public.transfers(escrow_id);
CREATE INDEX IF NOT EXISTS idx_transfers_milestone_id ON public.transfers(milestone_id);
CREATE INDEX IF NOT EXISTS idx_transfers_provider_id ON public.transfers(provider_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_reference ON public.transfers(reference);
CREATE INDEX IF NOT EXISTS idx_transfers_transfer_id ON public.transfers(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON public.transfers(created_at);

-- Permissions
GRANT SELECT, INSERT, UPDATE ON public.transfers TO authenticated;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_transfers_updated_at ON public.transfers;
CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour le statut d'un transfert
CREATE OR REPLACE FUNCTION update_transfer_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le transfert est complété, mettre à jour les données
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.processed_at = now();
  END IF;
  
  -- Si le transfert est annulé
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le statut
DROP TRIGGER IF EXISTS trigger_update_transfer_status ON public.transfers;
CREATE TRIGGER trigger_update_transfer_status
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION update_transfer_status();

-- Fonction pour obtenir les statistiques de transferts
CREATE OR REPLACE FUNCTION get_transfer_stats()
RETURNS TABLE (
  total_transfers bigint,
  completed_transfers bigint,
  failed_transfers bigint,
  processing_transfers bigint,
  total_amount numeric,
  completed_amount numeric,
  avg_transfer_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_transfers,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_transfers,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_transfers,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_transfers,
    COALESCE(SUM(amount), 0) as total_amount,
    COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as completed_amount,
    COALESCE(AVG(amount), 0) as avg_transfer_amount
  FROM public.transfers;
END;
$$ LANGUAGE plpgsql;

-- Vue pour les transferts récents avec détails
CREATE OR REPLACE VIEW recent_transfers_view AS
SELECT 
  t.id,
  t.reference,
  t.amount,
  t.currency,
  t.status,
  t.beneficiary_name,
  t.beneficiary_account,
  t.created_at,
  t.processed_at,
  m.title as milestone_title,
  m.percentage as milestone_percentage,
  pp.business_name as provider_business,
  p.full_name as admin_name,
  ea.amount_remaining as escrow_remaining
FROM public.transfers t
LEFT JOIN public.milestones m ON t.milestone_id = m.id
LEFT JOIN public.provider_profiles pp ON t.provider_id = pp.id
LEFT JOIN public.profiles p ON t.initiated_by = p.id
LEFT JOIN public.escrow_accounts ea ON t.escrow_id = ea.id
ORDER BY t.created_at DESC
LIMIT 50;