-- Create dedicated storage bucket for provider portfolio media
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket
CREATE POLICY "Public Access Portfolio Media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portfolio-media');

-- Allow authenticated users to upload media to their own folder
CREATE POLICY "Authenticated Upload Portfolio Media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own media
CREATE POLICY "Authenticated Update Portfolio Media"
ON storage.objects FOR UPDATE
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own media
CREATE POLICY "Authenticated Delete Portfolio Media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
