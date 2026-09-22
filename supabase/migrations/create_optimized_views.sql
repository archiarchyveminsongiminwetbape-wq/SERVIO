-- Create optimized views for admin dashboard

-- Drop existing views if they exist to avoid column naming conflicts
DROP VIEW IF EXISTS recent_transfers_view CASCADE;
DROP VIEW IF EXISTS manual_payments_with_bookings_view CASCADE;
DROP VIEW IF EXISTS milestones_with_details_view CASCADE;

-- View for recent transfers with related data
CREATE VIEW recent_transfers_view AS
SELECT 
  t.id,
  t.escrow_id,
  t.milestone_id,
  t.provider_id,
  t.amount,
  t.currency,
  t.transfer_id,
  t.reference,
  t.status,
  t.initiated_by,
  t.beneficiary_name,
  t.beneficiary_account,
  t.bank_code,
  t.provider_response,
  t.error_message,
  t.processed_at,
  t.cancelled_at,
  t.created_at,
  t.updated_at,
  m.title AS milestone_title,
  m.percentage AS milestone_percentage,
  ea.amount_remaining AS escrow_remaining,
  pp.business_name AS provider_business,
  p.full_name AS admin_name
FROM transfers t
LEFT JOIN milestones m ON t.milestone_id = m.id
LEFT JOIN escrow_accounts ea ON t.escrow_id = ea.id
LEFT JOIN provider_profiles pp ON t.provider_id = pp.user_id
LEFT JOIN profiles p ON t.initiated_by = p.id
ORDER BY t.created_at DESC;

-- View for manual payments with booking info
CREATE VIEW manual_payments_with_bookings_view AS
SELECT 
  mp.id,
  mp.tx_ref,
  mp.amount,
  mp.currency,
  mp.status,
  mp.payment_method,
  mp.customer_email,
  mp.customer_name,
  mp.customer_phone,
  mp.booking_id,
  mp.user_id,
  mp.admin_notes,
  mp.evidence_urls,
  mp.created_at,
  mp.confirmed_at,
  mp.confirmed_by,
  mp.rejected_at,
  mp.rejected_by,
  mp.rejection_reason,
  b.service_type,
  b.status AS booking_status,
  b.client_id,
  b.provider_id
FROM manual_payments mp
LEFT JOIN bookings b ON mp.booking_id = b.id
ORDER BY mp.created_at DESC;

-- View for milestones with escrow and booking info
CREATE VIEW milestones_with_details_view AS
SELECT 
  m.id,
  m.escrow_id,
  m.title,
  m.description,
  m.percentage,
  m.amount,
  m.status,
  m.evidence_urls,
  m.completed_at,
  m.approved_at,
  m.rejected_at,
  m.rejection_reason,
  m.paid_at,
  m.payment_reference,
  m.due_date,
  m.created_at,
  ea.id AS escrow_account_id,
  ea.total_amount,
  ea.currency,
  ea.status AS escrow_status,
  ea.release_percentage,
  ea.amount_released,
  ea.amount_remaining,
  b.id AS booking_id,
  b.client_id,
  b.provider_id,
  b.service_type,
  b.status AS booking_status,
  p.full_name AS client_name,
  p.email AS client_email,
  pp.business_name AS provider_business,
  pp.user_id AS provider_user_id
FROM milestones m
LEFT JOIN escrow_accounts ea ON m.escrow_id = ea.id
LEFT JOIN bookings b ON ea.booking_id = b.id
LEFT JOIN profiles p ON b.client_id = p.id
LEFT JOIN provider_profiles pp ON b.provider_id = pp.id
ORDER BY m.created_at DESC;

-- Function to get transfer statistics
CREATE OR REPLACE FUNCTION get_transfer_stats()
RETURNS TABLE (
  total_transfers BIGINT,
  completed_transfers BIGINT,
  failed_transfers BIGINT,
  processing_transfers BIGINT,
  total_amount NUMERIC,
  completed_amount NUMERIC,
  avg_transfer_amount NUMERIC
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
  FROM transfers;
END;
$$ LANGUAGE plpgsql;

-- Function to get payment statistics
CREATE OR REPLACE FUNCTION get_payment_stats()
RETURNS TABLE (
  total_payments BIGINT,
  total_volume NUMERIC,
  pending_payments BIGINT,
  confirmed_payments BIGINT,
  rejected_payments BIGINT,
  orange_money_payments BIGINT,
  avg_payment_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_payments,
    COALESCE(SUM(amount), 0) as total_volume,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_payments,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_payments,
    COUNT(*) FILTER (WHERE payment_method = 'orange_money') as orange_money_payments,
    COALESCE(AVG(amount), 0) as avg_payment_amount
  FROM manual_payments;
END;
$$ LANGUAGE plpgsql;

-- Function to get milestone statistics
CREATE OR REPLACE FUNCTION get_milestone_stats()
RETURNS TABLE (
  total_milestones BIGINT,
  pending_milestones BIGINT,
  approved_milestones BIGINT,
  rejected_milestones BIGINT,
  paid_milestones BIGINT,
  total_amount NUMERIC,
  released_amount NUMERIC,
  pending_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_milestones,
    COUNT(*) FILTER (WHERE status = 'completed') as pending_milestones,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_milestones,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_milestones,
    COUNT(*) FILTER (WHERE status = 'paid') as paid_milestones,
    COALESCE(SUM(amount), 0) as total_amount,
    COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as released_amount,
    COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as pending_amount
  FROM milestones;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_bookings BIGINT,
  pending_payments BIGINT,
  pending_milestones BIGINT,
  total_revenue NUMERIC,
  pending_certifications BIGINT,
  active_escrow BIGINT,
  today_transactions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH 
  user_count AS (
    SELECT COUNT(*) as count FROM profiles
  ),
  booking_count AS (
    SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'
  ),
  payment_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount
    FROM manual_payments
  ),
  milestone_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE status = 'completed') as pending,
      COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as pending_amount
    FROM milestones
  ),
  certification_count AS (
    SELECT COUNT(*) as count FROM certifications WHERE status = 'pending'
  ),
  escrow_stats AS (
    SELECT 
      COUNT(*) as count,
      COALESCE(SUM(total_amount), 0) as total_amount
    FROM escrow_accounts WHERE status = 'active'
  ),
  today_transactions AS (
    SELECT COUNT(*) as count 
    FROM manual_payments 
    WHERE status = 'confirmed' 
    AND DATE(created_at) = CURRENT_DATE
  )
  SELECT 
    uc.count as total_users,
    bc.count as active_bookings,
    ps.pending as pending_payments,
    ms.pending as pending_milestones,
    ps.pending_amount + ms.pending_amount + es.total_amount as total_revenue,
    cc.count as pending_certifications,
    es.count as active_escrow,
    tt.count as today_transactions
  FROM user_count uc, booking_count bc, payment_stats ps, 
       milestone_stats ms, certification_count cc, escrow_stats es, today_transactions tt;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON manual_payments(status);
CREATE INDEX IF NOT EXISTS idx_manual_payments_created_at ON manual_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_escrow_id ON milestones(escrow_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_status ON escrow_accounts(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON certifications(status);

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
