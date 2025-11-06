-- Security Fix 1: Rate limiting function for error logs
CREATE OR REPLACE FUNCTION public.check_error_rate_limit(_url TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.error_logs
  WHERE url = _url
  AND created_at > now() - INTERVAL '1 minute';
  
  RETURN recent_count < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Replace the existing policy with rate-limited version
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;

CREATE POLICY "Rate limited error log submissions"
ON public.error_logs FOR INSERT
TO public
WITH CHECK (check_error_rate_limit(url));

-- Cleanup function for old error logs
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.error_logs
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;