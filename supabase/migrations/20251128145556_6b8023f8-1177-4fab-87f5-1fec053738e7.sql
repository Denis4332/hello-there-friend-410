-- Add missing admin INSERT policy for profile_contacts
-- This allows admins to insert contact data when creating profiles without user accounts
-- NOTE: Existing SELECT policies for public visibility remain unchanged

CREATE POLICY "Admins can insert contact data" 
ON profile_contacts 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));