-- Create RPC function to increment portfolio views
CREATE OR REPLACE FUNCTION increment_portfolio_views(portfolio_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE portfolio_items
    SET views = COALESCE(views, 0) + 1
    WHERE id = portfolio_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_portfolio_views(UUID) TO authenticated;
