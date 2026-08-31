ALTER TABLE public.file_links
DROP CONSTRAINT IF EXISTS file_links_source_url_format;

ALTER TABLE public.file_links
ADD CONSTRAINT file_links_source_url_format
CHECK (
  source_url ~ '^https?://' OR
  source_url ~ '^lovable-storage://file-uploads/[A-Za-z0-9_-]{8,40}(\.[A-Za-z0-9]{1,12})?$'
);