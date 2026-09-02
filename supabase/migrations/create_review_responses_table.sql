-- Create review_responses table for provider responses to reviews
CREATE TABLE IF NOT EXISTS review_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_responder_id ON review_responses(responder_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_created_at ON review_responses(created_at DESC);

-- Enable RLS
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can read responses
DROP POLICY IF EXISTS "Responses are viewable by everyone" ON review_responses;
CREATE POLICY "Responses are viewable by everyone"
  ON review_responses FOR SELECT
  USING (true);

-- Only the responder can update their own response
DROP POLICY IF EXISTS "Users can update their own responses" ON review_responses;
CREATE POLICY "Users can update their own responses"
  ON review_responses FOR UPDATE
  USING (auth.uid() = responder_id);

-- Only the responder can delete their own response
DROP POLICY IF EXISTS "Users can delete their own responses" ON review_responses;
CREATE POLICY "Users can delete their own responses"
  ON review_responses FOR DELETE
  USING (auth.uid() = responder_id);

-- Anyone can insert a response (providers and admins)
DROP POLICY IF EXISTS "Anyone can insert responses" ON review_responses;
CREATE POLICY "Anyone can insert responses"
  ON review_responses FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_review_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_review_responses_updated_at_trigger ON review_responses;
CREATE TRIGGER update_review_responses_updated_at_trigger
  BEFORE UPDATE ON review_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_review_responses_updated_at();
