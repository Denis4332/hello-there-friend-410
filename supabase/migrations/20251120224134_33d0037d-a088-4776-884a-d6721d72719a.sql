-- Create storage bucket for banner advertisements
INSERT INTO storage.buckets (id, name, public)
VALUES ('advertisements', 'advertisements', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for banner images
CREATE POLICY "Anyone can view advertisement banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'advertisements');

CREATE POLICY "Authenticated users can upload advertisement banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'advertisements' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own advertisement banners"
ON storage.objects FOR UPDATE
USING (bucket_id = 'advertisements' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own advertisement banners"
ON storage.objects FOR DELETE
USING (bucket_id = 'advertisements' AND auth.role() = 'authenticated');