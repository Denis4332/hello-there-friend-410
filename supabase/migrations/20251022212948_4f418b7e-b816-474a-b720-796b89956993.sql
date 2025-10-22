-- Add status and read_at columns to contact_messages table
ALTER TABLE public.contact_messages 
ADD COLUMN status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read'));

ALTER TABLE public.contact_messages
ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on status
CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);

-- RLS Policy: Admins can update contact messages (mark as read/unread)
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policy: Admins can delete contact messages
CREATE POLICY "Admins can delete contact messages"
ON public.contact_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));