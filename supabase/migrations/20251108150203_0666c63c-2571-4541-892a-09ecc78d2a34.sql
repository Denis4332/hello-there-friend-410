-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create storage bucket for sitemaps
INSERT INTO storage.buckets (id, name, public)
VALUES ('sitemaps', 'sitemaps', true)
ON CONFLICT (id) DO NOTHING;

-- Allow everyone to read sitemaps
CREATE POLICY "Public sitemap read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'sitemaps');

-- Allow service role to upload/update sitemaps
CREATE POLICY "Service role can manage sitemaps"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'sitemaps')
WITH CHECK (bucket_id = 'sitemaps');