-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'system',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create composite index for user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read, created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify on payment status change
CREATE OR REPLACE FUNCTION notify_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    PERFORM create_notification(
      NEW.user_id,
      'payment',
      'Statut de paiement mis à jour',
      'Votre paiement ' || NEW.tx_ref || ' est maintenant ' || NEW.status,
      jsonb_build_object(
        'payment_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payment notifications
CREATE TRIGGER trigger_payment_status_notification
  AFTER UPDATE OF status ON manual_payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_status();

-- Function to notify on milestone status change
CREATE OR REPLACE FUNCTION notify_milestone_status()
RETURNS TRIGGER AS $$
DECLARE
  provider_id UUID;
BEGIN
  IF NEW.status != OLD.status THEN
    -- Get provider ID from escrow account
    SELECT provider_id INTO provider_id
    FROM escrow_accounts ea
    JOIN bookings b ON ea.booking_id = b.id
    WHERE ea.id = NEW.escrow_id;

    IF provider_id IS NOT NULL THEN
      PERFORM create_notification(
        provider_id,
        'milestone',
        'Statut de jalon mis à jour',
        'Le jalon "' || NEW.title || '" est maintenant ' || NEW.status,
        jsonb_build_object(
          'milestone_id', NEW.id,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for milestone notifications
CREATE TRIGGER trigger_milestone_status_notification
  AFTER UPDATE OF status ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION notify_milestone_status();

-- Function to notify on certification status change
CREATE OR REPLACE FUNCTION notify_certification_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    PERFORM create_notification(
      NEW.user_id,
      'certification',
      'Statut de certification mis à jour',
      'Votre certification est maintenant ' || NEW.status,
      jsonb_build_object(
        'certification_id', NEW.id,
        'certification_type', NEW.certification_type,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for certification notifications
CREATE TRIGGER trigger_certification_status_notification
  AFTER UPDATE OF status ON certifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_certification_status();

-- Function to clean old notifications (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND read = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup function (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications()');
