-- Add missing is_read column to notifications
-- This migration preserves compatibility with older notification schemas.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'is_read'
  ) THEN
    UPDATE public.notifications
    SET is_read = false
    WHERE is_read IS NULL;

    ALTER TABLE public.notifications
      ALTER COLUMN is_read SET NOT NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
