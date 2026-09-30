-- Create message_attachments table for file attachments in messages
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  file_size INTEGER NOT NULL, -- Size in bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_created_at ON message_attachments(created_at DESC);

-- Enable RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can read attachments (if they can read the message)
DROP POLICY IF EXISTS "Attachments are viewable by everyone" ON message_attachments;
CREATE POLICY "Attachments are viewable by everyone"
  ON message_attachments FOR SELECT
  USING (true);

-- Only the message sender can insert attachments
DROP POLICY IF EXISTS "Users can insert attachments to their messages" ON message_attachments;
CREATE POLICY "Users can insert attachments to their messages"
  ON message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages 
      WHERE messages.id = message_attachments.message_id 
      AND messages.sender_id = auth.uid()
    )
  );

-- Only the message sender can delete attachments
DROP POLICY IF EXISTS "Users can delete their own attachments" ON message_attachments;
CREATE POLICY "Users can delete their own attachments"
  ON message_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM messages 
      WHERE messages.id = message_attachments.message_id 
      AND messages.sender_id = auth.uid()
    )
  );
