-- User können ihre eigenen PENDING Anfragen löschen
CREATE POLICY "Users can delete own pending requests"
ON public.profile_change_requests
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  AND status = 'pending'
);