-- Allow authenticated users to submit banner booking inquiries
-- They can ONLY create entries with active=false and payment_status='pending'
-- Admin approval is still required to activate banners

CREATE POLICY "Authenticated users can submit banner inquiries"
ON public.advertisements FOR INSERT
TO authenticated
WITH CHECK (
  active = false AND
  payment_status = 'pending'
);