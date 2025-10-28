-- Security Fix: Contact Form Rate Limiting (max 3 messages per hour per email)
CREATE OR REPLACE FUNCTION check_contact_rate_limit(_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM contact_messages
  WHERE email = _email
  AND created_at > now() - INTERVAL '1 hour';
  
  RETURN recent_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policy for contact_messages with rate limiting
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON contact_messages;

CREATE POLICY "Rate limited contact submissions"
ON contact_messages FOR INSERT
TO public
WITH CHECK (check_contact_rate_limit(email));