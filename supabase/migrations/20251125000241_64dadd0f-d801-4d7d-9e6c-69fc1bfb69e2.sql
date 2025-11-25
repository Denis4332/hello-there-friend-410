-- Drop old restrictive policy that only allowed authenticated users
DROP POLICY IF EXISTS "Authenticated users can view active profile contacts" ON profile_contacts;

-- Create new public policy allowing both anonymous and authenticated users to view contacts
CREATE POLICY "Public can view active profile contacts"
ON profile_contacts
FOR SELECT
TO anon, authenticated
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE status = 'active'
  )
);