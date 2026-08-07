-- Fix storage RLS policies for portfolio image uploads

-- Ensure the bucket exists (create if not)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('portfolio-demo-videos', 'portfolio-demo-videos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view portfolio images" ON storage.objects;

-- Create policy for authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload portfolio images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-demo-videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for authenticated users to view their own images
CREATE POLICY "Authenticated users can view portfolio images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'portfolio-demo-videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for public to view all portfolio images (for display on provider profiles)
CREATE POLICY "Public can view portfolio images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'portfolio-demo-videos');

-- Create policy for authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete portfolio images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio-demo-videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
