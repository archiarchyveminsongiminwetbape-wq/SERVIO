/*
# SERVIO — Core Schema Part 3: conversations, messages, reports, admin_actions

## New Tables
1. `conversations` — 1:1 threads between two users with last message preview
2. `messages` — individual messages with read status; trigger updates conversation preview
3. `reports` — flagged content for admin moderation (profile/portfolio/review/message)
4. `admin_actions` — audit log of admin moderation actions

## Security
- RLS enabled on all tables.
- Conversations/messages: participants can read/insert/update; admin has read access.
- Reports: reporter can insert and read own; admin can read all and update status.
- admin_actions: admin-only read and insert.
*/

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_preview text,
  last_message_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_conv_participants ON public.conversations(participant_a, participant_b);
CREATE INDEX IF NOT EXISTS idx_conv_last_msg ON public.conversations(last_message_at DESC);

DROP POLICY IF EXISTS "conversations_select_participants" ON public.conversations;
CREATE POLICY "conversations_select_participants" ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = participant_a OR auth.uid() = participant_b OR public.is_admin());

DROP POLICY IF EXISTS "conversations_insert_participant" ON public.conversations;
CREATE POLICY "conversations_insert_participant" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

DROP POLICY IF EXISTS "conversations_update_participant" ON public.conversations;
CREATE POLICY "conversations_update_participant" ON public.conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = participant_a OR auth.uid() = participant_b)
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_participants" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    ) OR public.is_admin()
  );

DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
CREATE POLICY "messages_insert_sender" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_update_read" ON public.messages;
CREATE POLICY "messages_update_read" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_preview = left(NEW.content, 100),
      last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_conv_last_msg ON public.messages;
CREATE TRIGGER trg_update_conv_last_msg
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL CHECK (report_type IN ('profile','portfolio','review','message')),
  target_id uuid NOT NULL,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_reporter_admin" ON public.reports;
CREATE POLICY "reports_select_reporter_admin" ON public.reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.is_admin());

DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;
CREATE POLICY "reports_update_admin" ON public.reports
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_type text,
  target_id uuid,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_actions_select_admin" ON public.admin_actions;
CREATE POLICY "admin_actions_select_admin" ON public.admin_actions
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_actions_insert_admin" ON public.admin_actions;
CREATE POLICY "admin_actions_insert_admin" ON public.admin_actions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
