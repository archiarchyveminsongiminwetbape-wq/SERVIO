-- Fix missing participant columns in conversations
-- This migration adds participant_a and participant_b if they are absent from the conversations table.

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS participant_a uuid,
  ADD COLUMN IF NOT EXISTS participant_b uuid;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'participant_a'
  ) THEN
    ALTER TABLE public.conversations ALTER COLUMN participant_a DROP NOT NULL;
    ALTER TABLE public.conversations ALTER COLUMN participant_a SET DEFAULT NULL;
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'public'
        AND table_name = 'conversations'
        AND constraint_name = 'conversations_participant_a_fkey'
    ) THEN
      ALTER TABLE public.conversations
        ADD CONSTRAINT conversations_participant_a_fkey
        FOREIGN KEY (participant_a) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'participant_b'
  ) THEN
    ALTER TABLE public.conversations ALTER COLUMN participant_b DROP NOT NULL;
    ALTER TABLE public.conversations ALTER COLUMN participant_b SET DEFAULT NULL;
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'public'
        AND table_name = 'conversations'
        AND constraint_name = 'conversations_participant_b_fkey'
    ) THEN
      ALTER TABLE public.conversations
        ADD CONSTRAINT conversations_participant_b_fkey
        FOREIGN KEY (participant_b) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_conv_participants ON public.conversations(participant_a, participant_b);
