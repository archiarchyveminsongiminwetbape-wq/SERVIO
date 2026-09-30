-- Create missing functions for statistics
-- Migration timestamp: 20260928100032

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_payment_stats() TO authenticated;