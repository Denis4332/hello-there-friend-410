-- 1. Create private storage bucket for change request media
INSERT INTO storage.buckets (id, name, public)
VALUES ('change-request-media', 'change-request-media', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policy: Users can upload to their own profile folder
CREATE POLICY "Users can upload change request media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'change-request-media' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(name))[1] = p.id::text
  )
);

-- 3. Storage policy: Admins can view all media
CREATE POLICY "Admins can view change request media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'change-request-media' AND
  public.has_role(auth.uid(), 'admin')
);

-- 4. Storage policy: Admins can delete media
CREATE POLICY "Admins can delete change request media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'change-request-media' AND
  public.has_role(auth.uid(), 'admin')
);

-- 5. Create table to track media files for change requests
CREATE TABLE public.change_request_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.profile_change_requests(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS
ALTER TABLE public.change_request_media ENABLE ROW LEVEL SECURITY;

-- 7. Users can view their own request media
CREATE POLICY "Users can view own request media"
ON public.change_request_media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profile_change_requests pcr
    WHERE pcr.id = request_id AND pcr.user_id = auth.uid()
  )
);

-- 8. Users can insert media for their own requests
CREATE POLICY "Users can insert media for own requests"
ON public.change_request_media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profile_change_requests pcr
    JOIN public.profiles p ON p.id = pcr.profile_id
    WHERE pcr.id = request_id AND p.user_id = auth.uid()
  )
);

-- 9. Admins can do everything with media
CREATE POLICY "Admins can manage all media"
ON public.change_request_media FOR ALL
USING (public.has_role(auth.uid(), 'admin'));