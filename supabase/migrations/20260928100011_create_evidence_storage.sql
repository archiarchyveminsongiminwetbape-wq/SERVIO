-- Création du bucket de stockage pour les preuves de jalons

-- Insert the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  true, -- Public pour accéder aux images directement
  10485760, -- 10MB max par fichier
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Politiques RLS pour le bucket evidence

-- Politique pour permettre l'upload aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Users can upload evidence" ON storage.objects;
CREATE POLICY "Users can upload evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre aux utilisateurs de voir leurs propres fichiers
CREATE POLICY "Users can view own evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre aux admins de voir tous les fichiers
CREATE POLICY "Admins can view all evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Politique pour permettre aux providers de voir les preuves de leurs projets
CREATE POLICY "Providers can view project evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence' AND
  EXISTS (
    SELECT 1 FROM public.milestones m
    JOIN public.escrow_accounts ea ON ea.id = m.escrow_id
    JOIN public.bookings b ON b.id = ea.booking_id
    JOIN public.provider_profiles pp ON pp.id = b.provider_id
    WHERE pp.user_id = auth.uid()
    AND m.evidence_urls @> ARRAY[storage.foldername(name)]
  )
);

-- Politique pour permettre aux clients de voir les preuves de leurs projets
CREATE POLICY "Clients can view project evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence' AND
  EXISTS (
    SELECT 1 FROM public.milestones m
    JOIN public.escrow_accounts ea ON ea.id = m.escrow_id
    JOIN public.bookings b ON b.id = ea.booking_id
    WHERE b.client_id = auth.uid()
    AND m.evidence_urls @> ARRAY[storage.foldername(name)]
  )
);

-- Politique pour permettre aux utilisateurs de supprimer leurs propres fichiers
CREATE POLICY "Users can delete own evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre aux admins de supprimer n'importe quel fichier
CREATE POLICY "Admins can delete evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Politique pour mettre à jour les fichiers (rarement utilisé)
CREATE POLICY "Users can update own evidence"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
