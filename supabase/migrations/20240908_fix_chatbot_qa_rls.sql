-- Fix RLS policies for chatbot_qa table to allow public access to active questions

-- Disable RLS temporarily to ensure policies are correctly set
ALTER TABLE chatbot_qa DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE chatbot_qa ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Tout le monde peut voir les questions/réponses actives" ON chatbot_qa;
DROP POLICY IF EXISTS "Seuls les admins peuvent gérer les questions/réponses" ON chatbot_qa;

-- Create policy for public read access to active questions
CREATE POLICY "Tout le monde peut voir les questions/réponses actives"
  ON chatbot_qa FOR SELECT
  USING (is_active = true);

-- Create policy for admin management (INSERT, UPDATE, DELETE)
CREATE POLICY "Seuls les admins peuvent gérer les questions/réponses"
  ON chatbot_qa FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IN ('super_admin', 'admin')
    )
  );

-- Grant public access for reading
GRANT SELECT ON chatbot_qa TO anon;
GRANT SELECT ON chatbot_qa TO authenticated;
