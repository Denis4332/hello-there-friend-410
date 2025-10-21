-- =====================================================
-- Security Fixes Migration
-- =====================================================

-- Fix 1: Add RLS Policies to user_roles table
-- This prevents privilege escalation attacks

CREATE POLICY "Admins can view roles"
ON user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage roles"
ON user_roles FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Add DELETE policy for reports table
-- Allows admins to delete reports for GDPR compliance

CREATE POLICY "Admins can delete reports"
ON reports FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: Update Storage RLS Policies for profile-photos bucket
-- This ensures users can only upload to their own profile folders

-- Remove old incomplete policies
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;

-- Create proper policy with ownership verification for uploads
CREATE POLICY "Users can upload to own profile folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
  )
);

-- Allow users to read their own uploaded photos
CREATE POLICY "Users can read own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
  )
);

-- Public can view photos from active profiles
CREATE POLICY "Public can view active profile photos"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'profile-photos'
  AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN photos ph ON ph.profile_id = p.id
    WHERE ph.storage_path = name
    AND p.status = 'active'
  )
);