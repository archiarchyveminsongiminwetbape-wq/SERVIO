-- Add missing notification columns to notifications
-- This migration protects against outdated schemas where the notifications table predates the body, link or message fields.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS link text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'message'
  ) THEN
    ALTER TABLE public.notifications ALTER COLUMN message DROP NOT NULL;
    ALTER TABLE public.notifications ALTER COLUMN message SET DEFAULT '';
    UPDATE public.notifications
    SET body = message
    WHERE body IS NULL AND message IS NOT NULL;
  END IF;
END;
$$;
