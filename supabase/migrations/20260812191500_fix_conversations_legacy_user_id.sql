-- Fix legacy conversations schema compatibility
-- Some deployments still have an old NOT NULL user_id column on conversations.
-- This migration ensures new participant_a/participant_b inserts satisfy the legacy constraint.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'participant_a'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN participant_a uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'participant_b'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN participant_b uuid;
  END IF;
END;
$$;

DO $do$
DECLARE
  has_user_id boolean;
  has_client_id boolean;
  has_provider_id boolean;
  legacy_function_sql text := '';
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'user_id'
  ) INTO has_user_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'client_id'
  ) INTO has_client_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'provider_id'
  ) INTO has_provider_id;

  IF has_user_id OR has_client_id OR has_provider_id THEN
    legacy_function_sql := 'CREATE OR REPLACE FUNCTION public.conversations_fill_legacy_conversation_cols() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $func$ BEGIN ';

    IF has_user_id THEN
      legacy_function_sql := legacy_function_sql || ' IF NEW.user_id IS NULL THEN NEW.user_id := NEW.participant_a; END IF;';
    END IF;

    IF has_client_id THEN
      legacy_function_sql := legacy_function_sql || ' IF NEW.client_id IS NULL THEN NEW.client_id := NEW.participant_a; END IF;';
    END IF;

    IF has_provider_id THEN
      legacy_function_sql := legacy_function_sql || ' IF NEW.provider_id IS NULL THEN NEW.provider_id := NEW.participant_b; END IF;';
    END IF;

    legacy_function_sql := legacy_function_sql || ' RETURN NEW; END; $func$;';

    EXECUTE legacy_function_sql;
    EXECUTE 'DROP TRIGGER IF EXISTS trg_conversations_fill_legacy_conversation_cols ON public.conversations;';
    EXECUTE 'CREATE TRIGGER trg_conversations_fill_legacy_conversation_cols BEFORE INSERT OR UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.conversations_fill_legacy_conversation_cols();';

    IF has_user_id THEN
      EXECUTE 'UPDATE public.conversations SET user_id = participant_a WHERE user_id IS NULL;';
    END IF;

    IF has_client_id THEN
      EXECUTE 'UPDATE public.conversations SET client_id = participant_a WHERE client_id IS NULL;';
    END IF;

    IF has_provider_id THEN
      EXECUTE 'UPDATE public.conversations SET provider_id = participant_b WHERE provider_id IS NULL;';
    END IF;
  END IF;
END;
$do$;
