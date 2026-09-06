-- A client can publish at most one review per provider. The app-level check is
-- not enough because two requests can pass it at the same time.
-- The current schema reviews providers directly, not mission/booking records.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_provider_author_unique
  ON public.reviews(provider_id, author_id);