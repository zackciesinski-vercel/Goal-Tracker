-- Create storage bucket for goal icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('icons', 'icons', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload icons
CREATE POLICY "Authenticated users can upload icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'icons');

-- Allow public read access to icons
CREATE POLICY "Public can view icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'icons');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'icons' AND auth.uid()::text = (storage.foldername(name))[1]);
