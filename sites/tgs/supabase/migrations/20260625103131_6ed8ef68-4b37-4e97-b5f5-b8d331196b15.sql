CREATE POLICY "Public can read shared upload objects"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'file-uploads');

CREATE POLICY "Trusted backend can manage upload objects"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'file-uploads')
WITH CHECK (bucket_id = 'file-uploads');