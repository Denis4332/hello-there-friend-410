-- Enable RLS on profile_contacts if not already enabled
ALTER TABLE profile_contacts ENABLE ROW LEVEL SECURITY;

-- Add policy for public read access to contact data of active profiles
CREATE POLICY "Public can view contact data of active profiles"
ON profile_contacts
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = profile_contacts.profile_id
    AND profiles.status = 'active'
  )
);