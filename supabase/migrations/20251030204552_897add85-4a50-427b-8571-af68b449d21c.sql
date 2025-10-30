-- Phase 2: Function Search Path Fix
-- Update check_contact_rate_limit function with explicit search_path

CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM contact_messages
  WHERE email = _email
  AND created_at > now() - INTERVAL '1 hour';
  
  RETURN recent_count < 3;
END;
$$;