-- Simple permissions fix - only grant permissions and create helper functions
-- Migration timestamp: 20260928100031

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

-- Grant execute permission on the statistics functions to authenticated users
GRANT EXECUTE ON FUNCTION get_transfer_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_milestone_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;