-- Add performance indexes for better query performance

-- Provider profiles indexes
CREATE INDEX IF NOT EXISTS idx_provider_profiles_slug ON provider_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_city ON provider_profiles(city);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_category ON provider_profiles(category_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_availability ON provider_profiles(availability);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_rating ON provider_profiles(rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_user_id ON provider_profiles(user_id);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_provider_id ON conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_provider_id ON favorites(provider_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- Portfolio items indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_provider_id ON portfolio_items(provider_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_is_published ON portfolio_items(is_published);
CREATE INDEX IF NOT EXISTS idx_portfolio_sort_order ON portfolio_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_portfolio_created_at ON portfolio_items(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_status ON bookings(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_provider_rating ON reviews(provider_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_provider_published ON portfolio_items(provider_id, is_published);
