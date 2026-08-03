-- Grant necessary permissions to authenticated role for new tables

-- Notifications table
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE notifications TO authenticated;
GRANT ALL ON SEQUENCE notifications_id_seq TO authenticated;

-- Conversations table
GRANT ALL ON TABLE conversations TO authenticated;
GRANT ALL ON SEQUENCE conversations_id_seq TO authenticated;

-- Messages table
GRANT ALL ON TABLE messages TO authenticated;
GRANT ALL ON SEQUENCE messages_id_seq TO authenticated;

-- Portfolio items table
GRANT ALL ON TABLE portfolio_items TO authenticated;
GRANT ALL ON SEQUENCE portfolio_items_id_seq TO authenticated;

-- Favorites table
GRANT ALL ON TABLE favorites TO authenticated;
GRANT ALL ON SEQUENCE favorites_id_seq TO authenticated;

-- Reviews table
GRANT ALL ON TABLE reviews TO authenticated;
GRANT ALL ON SEQUENCE reviews_id_seq TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
