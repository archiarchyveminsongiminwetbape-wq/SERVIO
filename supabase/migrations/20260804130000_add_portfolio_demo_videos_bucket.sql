-- Create dedicated storage bucket for provider demonstration videos and portfolio media
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-demo-videos', 'portfolio-demo-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read the demo media
CREATE POLICY "Public Read Portfolio Demo Videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portfolio-demo-videos');

-- Authenticated providers can upload media only inside their own provider folder
CREATE POLICY "Provider Upload Portfolio Demo Videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-demo-videos'
  AND EXISTS (
    SELECT 1
    FROM public.provider_profiles pp
    WHERE pp.id::text = (storage.foldername(name))[1]
      AND pp.user_id = auth.uid()
  )
);

-- Providers can update their own demo media
CREATE POLICY "Provider Update Portfolio Demo Videos"
ON storage.objects FOR UPDATE
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-demo-videos'
  AND EXISTS (
    SELECT 1
    FROM public.provider_profiles pp
    WHERE pp.id::text = (storage.foldername(name))[1]
      AND pp.user_id = auth.uid()
  )
);

-- Providers can delete their own demo media
CREATE POLICY "Provider Delete Portfolio Demo Videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio-demo-videos'
  AND EXISTS (
    SELECT 1
    FROM public.provider_profiles pp
    WHERE pp.id::text = (storage.foldername(name))[1]
      AND pp.user_id = auth.uid()
  )
);
