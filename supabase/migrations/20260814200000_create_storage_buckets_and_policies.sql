-- ==============================================================================
-- Migration: Create Storage Buckets and RLS Policies for Avatars, Banners & Media
-- ==============================================================================

-- 1. Create Buckets if they don't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('banners', 'banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('portfolio-media', 'portfolio-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']),
  ('media', 'media', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Public Read Access for all buckets
DROP POLICY IF EXISTS "Public Access for avatars" ON storage.objects;
CREATE POLICY "Public Access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id IN ('avatars', 'banners', 'portfolio-media', 'media'));

-- 4. Authenticated Insert Policy for Avatars
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('avatars', 'banners', 'portfolio-media', 'media'));

-- 5. Authenticated Update Policy
DROP POLICY IF EXISTS "Authenticated users can update their uploads" ON storage.objects;
CREATE POLICY "Authenticated users can update their uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('avatars', 'banners', 'portfolio-media', 'media'));

-- 6. Authenticated Delete Policy
DROP POLICY IF EXISTS "Authenticated users can delete their uploads" ON storage.objects;
CREATE POLICY "Authenticated users can delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('avatars', 'banners', 'portfolio-media', 'media'));
