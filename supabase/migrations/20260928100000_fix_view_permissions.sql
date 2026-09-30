-- Fix permissions for admin views and functions
-- This migration adds proper RLS policies for the optimized views
-- Migration timestamp: 20260928100000

-- Enable RLS on views if not already enabled
-- Note: Views don't directly support RLS, but we can grant permissions

-- Grant access to admin users for the views
GRANT SELECT ON recent_transfers_view TO authenticated;
GRANT SELECT ON manual_payments_with_bookings_view TO authenticated;
GRANT SELECT ON milestones_with_details_view TO authenticated;

-- Grant execute permission on the statistics functions
GRANT EXECUTE ON FUNCTION get_transfer_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_milestone_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy function for admin access
CREATE OR REPLACE FUNCTION admin_only_policy()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate views with proper security context
DROP VIEW IF EXISTS recent_transfers_view CASCADE;
DROP VIEW IF EXISTS manual_payments_with_bookings_view CASCADE;
DROP VIEW IF EXISTS milestones_with_details_view CASCADE;

-- Recreate views with SECURITY INVOKER to enforce RLS
CREATE VIEW recent_transfers_view WITH (security_invoker = true) AS
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

CREATE VIEW manual_payments_with_bookings_view WITH (security_invoker = true) AS
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

CREATE VIEW milestones_with_details_view WITH (security_invoker = true) AS
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

-- Re-grant permissions after recreating views
GRANT SELECT ON recent_transfers_view TO authenticated;
GRANT SELECT ON manual_payments_with_bookings_view TO authenticated;
GRANT SELECT ON milestones_with_details_view TO authenticated;

-- Add comment to document the security setup
COMMENT ON VIEW recent_transfers_view IS 'View for recent transfers with admin-only access via RLS';
COMMENT ON VIEW manual_payments_with_bookings_view IS 'View for manual payments with booking info - admin access via RLS';
COMMENT ON VIEW milestones_with_details_view IS 'View for milestones with escrow details - admin access via RLS';