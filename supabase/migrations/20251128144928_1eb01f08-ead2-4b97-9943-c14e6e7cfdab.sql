-- Make user_id nullable to allow admin-created profiles without user accounts
ALTER TABLE profiles ALTER COLUMN user_id DROP NOT NULL;

-- Add RLS policy for admins to create profiles
CREATE POLICY "Admins can create profiles" 
ON profiles 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add comment to document this change
COMMENT ON COLUMN profiles.user_id IS 'User ID of profile owner. NULL for admin-created profiles (agencies, promotions).';