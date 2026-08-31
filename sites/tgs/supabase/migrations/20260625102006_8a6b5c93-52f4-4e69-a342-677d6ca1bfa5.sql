DROP POLICY IF EXISTS "Anyone can create file link mappings" ON public.file_links;

REVOKE INSERT ON public.file_links FROM anon;
REVOKE INSERT ON public.file_links FROM authenticated;

CREATE POLICY "Trusted backend can manage file link mappings"
ON public.file_links
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);