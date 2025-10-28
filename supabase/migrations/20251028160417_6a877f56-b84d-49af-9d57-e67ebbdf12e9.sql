-- Verifizierungs-System (Optional)

-- 1. Tabelle: verification_submissions
CREATE TABLE verification_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS für verification_submissions
ALTER TABLE verification_submissions ENABLE ROW LEVEL SECURITY;

-- User können eigene Verifizierung einreichen
CREATE POLICY "Users can submit own verification"
ON verification_submissions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = verification_submissions.profile_id 
    AND user_id = auth.uid()
  )
);

-- User können eigene Verifizierung sehen
CREATE POLICY "Users can view own verification"
ON verification_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = verification_submissions.profile_id 
    AND user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Admins können Verifizierungen updaten
CREATE POLICY "Admins can update verifications"
ON verification_submissions FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins können Verifizierungen löschen
CREATE POLICY "Admins can delete verifications"
ON verification_submissions FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 2. Storage Bucket: verification-photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-photos', 'verification-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS für Storage: Users können eigene hochladen
CREATE POLICY "Users can upload own verification photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM profiles WHERE user_id = auth.uid()
  )
);

-- RLS für Storage: Admins können alle sehen
CREATE POLICY "Admins can view verification photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-photos' 
  AND has_role(auth.uid(), 'admin')
);

-- Users können eigene Verifizierungs-Fotos sehen
CREATE POLICY "Users can view own verification photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM profiles WHERE user_id = auth.uid()
  )
);