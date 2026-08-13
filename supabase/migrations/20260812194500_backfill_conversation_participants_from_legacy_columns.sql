-- Backfill missing conversation participant columns from legacy conversation schema
-- This migration ensures older rows with legacy user_id/client_id/provider_id still work with current RLS and query logic.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'participant_a'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'participant_b'
  ) THEN

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'conversations'
        AND column_name = 'user_id'
    ) THEN
      UPDATE public.conversations c
      SET participant_a = user_id
      WHERE participant_a IS NULL
        AND user_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM public.conversations c2
          WHERE c2.id <> c.id
            AND LEAST(c2.participant_a, c2.participant_b) = LEAST(user_id, COALESCE(c.participant_b, user_id))
            AND GREATEST(c2.participant_a, c2.participant_b) = GREATEST(user_id, COALESCE(c.participant_b, user_id))
        );
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'conversations'
        AND column_name = 'client_id'
    ) THEN
      UPDATE public.conversations c
      SET participant_a = client_id
      WHERE participant_a IS NULL
        AND client_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM public.conversations c2
          WHERE c2.id <> c.id
            AND LEAST(c2.participant_a, c2.participant_b) = LEAST(client_id, COALESCE(c.participant_b, client_id))
            AND GREATEST(c2.participant_a, c2.participant_b) = GREATEST(client_id, COALESCE(c.participant_b, client_id))
        );
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'conversations'
        AND column_name = 'provider_id'
    ) THEN
      UPDATE public.conversations c
      SET participant_b = provider_id
      WHERE participant_b IS NULL
        AND provider_id IS NOT NULL
        AND participant_a IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM public.conversations c2
          WHERE c2.id <> c.id
            AND LEAST(c2.participant_a, c2.participant_b) = LEAST(c.participant_a, provider_id)
            AND GREATEST(c2.participant_a, c2.participant_b) = GREATEST(c.participant_a, provider_id)
        );
    END IF;
  END IF;
END;
$$;
