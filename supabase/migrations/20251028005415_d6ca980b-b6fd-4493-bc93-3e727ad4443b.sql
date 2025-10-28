-- Fix search_path for check_contact_rate_limit function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;