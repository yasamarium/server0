CREATE TABLE public.file_links (
  slug TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  original_name TEXT,
  content_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT file_links_slug_format CHECK (slug ~ '^[A-Za-z0-9_-]{8,40}(\.[A-Za-z0-9]{1,12})?$'),
  CONSTRAINT file_links_source_url_format CHECK (source_url ~ '^https?://')
);

GRANT SELECT, INSERT ON public.file_links TO anon;
GRANT SELECT, INSERT ON public.file_links TO authenticated;
GRANT ALL ON public.file_links TO service_role;

ALTER TABLE public.file_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read file link mappings"
ON public.file_links
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can create file link mappings"
ON public.file_links
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE INDEX file_links_created_at_idx ON public.file_links (created_at DESC);