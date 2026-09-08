-- Create attachments storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('attachments', 'attachments', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their attachments" ON storage.objects;

-- Public read access for attachments (since messages are shared between users)
CREATE POLICY "Public can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

-- Authenticated users can upload attachments
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users can delete their own attachments
CREATE POLICY "Authenticated users can delete their attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
