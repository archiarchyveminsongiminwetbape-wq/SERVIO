-- Normalize legacy messaging columns so historical rows remain readable by the app.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'read'
  ) THEN
    EXECUTE 'UPDATE public.messages SET read_at = COALESCE(read_at, CASE WHEN read THEN created_at ELSE NULL END) WHERE read_at IS NULL';
  END IF;
END;
$$;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS participant_a uuid,
  ADD COLUMN IF NOT EXISTS participant_b uuid,
  ADD COLUMN IF NOT EXISTS last_message_preview text,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'user_id'
  ) THEN
    EXECUTE 'UPDATE public.conversations SET participant_a = COALESCE(participant_a, user_id) WHERE participant_a IS NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'provider_id'
  ) THEN
    EXECUTE 'UPDATE public.conversations SET participant_b = COALESCE(participant_b, provider_id) WHERE participant_b IS NULL';
  END IF;
END;
$$;

-- Rebuild previews from the actual historical messages.
UPDATE public.conversations AS c
SET last_message_preview = latest.content,
    last_message_at = latest.created_at
FROM (
  SELECT DISTINCT ON (conversation_id)
    conversation_id,
    left(content, 100) AS content,
    created_at
  FROM public.messages
  ORDER BY conversation_id, created_at DESC
) AS latest
WHERE latest.conversation_id = c.id
  AND (c.last_message_at IS NULL OR latest.created_at > c.last_message_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at);
