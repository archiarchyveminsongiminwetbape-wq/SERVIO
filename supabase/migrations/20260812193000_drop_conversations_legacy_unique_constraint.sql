-- Drop legacy unique constraint on old conversations columns and enforce participant pair uniqueness
-- This fixes errors caused by legacy conversation schema fields such as user_id/provider_id.

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_user_id_provider_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND n.nspname = 'public'
      AND c.relname = 'conversations_unique_participants'
  ) THEN
    CREATE UNIQUE INDEX conversations_unique_participants
      ON public.conversations (LEAST(participant_a, participant_b), GREATEST(participant_a, participant_b));
  END IF;
END;
$$;
