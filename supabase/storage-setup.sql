-- STORAGE BUCKETS SETUP FOR SERVIO
-- ===================================
-- Run this in Supabase Dashboard SQL Editor with admin/owner privileges
-- This will create the necessary storage buckets and RLS policies

-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('banners', 'banners', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('portfolio-media', 'portfolio-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- Supabase manages RLS ownership for storage.objects.

-- Policies are recreated safely when this script is run more than once.
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('avatars', 'banners', 'portfolio-media')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('avatars', 'banners', 'portfolio-media')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Public can view files in public buckets" ON storage.objects;
CREATE POLICY "Public can view files in public buckets"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('avatars', 'banners', 'portfolio-media')
);

DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('avatars', 'banners', 'portfolio-media')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('avatars', 'banners', 'portfolio-media')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Supabase owns the storage schema and manages its grants. Do not grant ALL
-- on storage objects from the SQL editor.
