/*
# SERVIO — Add notifications table

## New Table
- `notifications` — in-app notifications for users (new message, profile validated, new review, etc.)

## Security
- RLS enabled; owner-scoped CRUD (auth.uid() = user_id).
- Users can only see and manage their own notifications.
*/

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('message','validation','review','report','system')),
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Helper: create a notification for a user (callable from triggers or app)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text DEFAULT NULL,
  p_link text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (p_user_id, p_type, p_title, p_body, p_link);
END;
$$;

-- Trigger: notify provider when they receive a new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id uuid;
  sender_name text;
BEGIN
  SELECT CASE
    WHEN c.participant_a = NEW.sender_id THEN c.participant_b
    ELSE c.participant_a
  END INTO recipient_id
  FROM public.conversations c WHERE c.id = NEW.conversation_id;

  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

  PERFORM public.create_notification(
    recipient_id,
    'message',
    'Nouveau message',
    COALESCE(sender_name, 'Un utilisateur') || ' vous a envoyé un message',
    '/messages'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- Trigger: notify provider when they receive a new review
CREATE OR REPLACE FUNCTION public.notify_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_user_id uuid;
BEGIN
  SELECT user_id INTO provider_user_id FROM public.provider_profiles WHERE id = NEW.provider_id;

  PERFORM public.create_notification(
    provider_user_id,
    'review',
    'Nouvel avis reçu',
    'Vous avez reçu un nouvel avis de ' || NEW.rating || ' étoile(s)',
    '/provider/dashboard'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_review ON public.reviews;
CREATE TRIGGER trg_notify_new_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_review();
