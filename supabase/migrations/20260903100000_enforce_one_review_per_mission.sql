-- A client can publish one review per provider. The UI check is not enough
-- because two requests can pass it at the same time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_provider_author_unique
  ON public.reviews(provider_id, author_id);