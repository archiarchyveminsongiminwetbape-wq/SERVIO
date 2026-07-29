/*
# SERVIO — Core Schema Part 2: portfolio_items, reviews, favorites

## New Tables
1. `portfolio_items` — provider realisations with photos, video, tags, category
2. `reviews` — client reviews with rating, comment, provider response; trigger updates provider rating
3. `favorites` — visitor saved providers (unique pair)

## Security
- RLS enabled on all tables.
- Portfolio: public read; owner-scoped writes via provider_profiles ownership check; admin can delete.
- Reviews: public read; author inserts/updates own; provider can update response fields; admin can delete.
- Favorites: owner-scoped CRUD.
*/

CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  photos text[] NOT NULL DEFAULT '{}',
  video_url text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_portfolio_provider ON public.portfolio_items(provider_id);

DROP POLICY IF EXISTS "portfolio_public_select" ON public.portfolio_items;
CREATE POLICY "portfolio_public_select" ON public.portfolio_items
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "portfolio_insert_own" ON public.portfolio_items;
CREATE POLICY "portfolio_insert_own" ON public.portfolio_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.provider_profiles p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "portfolio_update_own" ON public.portfolio_items;
CREATE POLICY "portfolio_update_own" ON public.portfolio_items
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.provider_profiles p WHERE p.id = provider_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.provider_profiles p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "portfolio_delete_own" ON public.portfolio_items;
CREATE POLICY "portfolio_delete_own" ON public.portfolio_items
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.provider_profiles p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "portfolio_admin_delete" ON public.portfolio_items;
CREATE POLICY "portfolio_admin_delete" ON public.portfolio_items
  FOR DELETE TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS trg_portfolio_items_updated_at ON public.portfolio_items;
CREATE TRIGGER trg_portfolio_items_updated_at BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  provider_response text,
  provider_response_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_reviews_provider ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_author ON public.reviews(author_id);

DROP POLICY IF EXISTS "reviews_public_select" ON public.reviews;
CREATE POLICY "reviews_public_select" ON public.reviews
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "reviews_update_own_author" ON public.reviews;
CREATE POLICY "reviews_update_own_author" ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "reviews_update_provider_response" ON public.reviews;
CREATE POLICY "reviews_update_provider_response" ON public.reviews
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.provider_profiles p WHERE p.id = reviews.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.provider_profiles p WHERE p.id = reviews.provider_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reviews_delete_admin" ON public.reviews;
CREATE POLICY "reviews_delete_admin" ON public.reviews
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.provider_profiles
  SET rating_avg = (
    SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE provider_id = NEW.provider_id
  ),
  rating_count = (
    SELECT COUNT(*) FROM public.reviews WHERE provider_id = NEW.provider_id
  )
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_provider_rating_ins ON public.reviews;
CREATE TRIGGER trg_update_provider_rating_ins
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_rating();

DROP TRIGGER IF EXISTS trg_update_provider_rating_del ON public.reviews;
CREATE TRIGGER trg_update_provider_rating_del
  AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_rating();

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
CREATE POLICY "favorites_select_own" ON public.favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
CREATE POLICY "favorites_insert_own" ON public.favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;
CREATE POLICY "favorites_delete_own" ON public.favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
