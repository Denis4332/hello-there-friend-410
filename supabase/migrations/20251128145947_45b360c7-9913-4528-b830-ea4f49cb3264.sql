-- Complete RLS for profile_moderation_notes: Add UPDATE and DELETE for admins
-- Admin kann Moderationsnotizen bearbeiten
CREATE POLICY "Admins can update moderation notes" 
ON profile_moderation_notes 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin kann Moderationsnotizen löschen
CREATE POLICY "Admins can delete moderation notes" 
ON profile_moderation_notes 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Complete RLS for verification_submissions: Add INSERT for admins
-- Admin kann Verifikationen manuell erstellen (z.B. wenn Agentur Fotos per Email schickt)
CREATE POLICY "Admins can create verifications" 
ON verification_submissions 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));