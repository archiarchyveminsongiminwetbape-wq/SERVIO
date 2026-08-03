-- Grant necessary permissions to authenticated role for new tables
-- Note: These tables use UUID primary keys with gen_random_uuid(), so no sequences exist

-- Notifications table
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE notifications TO authenticated;

-- Conversations table
GRANT ALL ON TABLE conversations TO authenticated;

-- Messages table
GRANT ALL ON TABLE messages TO authenticated;

-- Portfolio items table
GRANT ALL ON TABLE portfolio_items TO authenticated;

-- Favorites table
GRANT ALL ON TABLE favorites TO authenticated;

-- Reviews table
GRANT ALL ON TABLE reviews TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
