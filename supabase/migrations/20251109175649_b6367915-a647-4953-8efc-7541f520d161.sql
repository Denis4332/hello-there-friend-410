-- Create function to get rate limits for admin dashboard
CREATE OR REPLACE FUNCTION public.get_rate_limits_for_admin()
RETURNS TABLE (
  id uuid,
  email text,
  attempt_type text,
  failed_attempts integer,
  last_attempt_at timestamptz,
  locked_until timestamptz,
  is_locked boolean,
  minutes_remaining integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    rl.id,
    rl.email,
    rl.attempt_type,
    rl.failed_attempts,
    rl.last_attempt_at,
    rl.locked_until,
    (rl.locked_until IS NOT NULL AND rl.locked_until > now()) as is_locked,
    CASE 
      WHEN rl.locked_until IS NOT NULL AND rl.locked_until > now() 
      THEN CEIL(EXTRACT(EPOCH FROM (rl.locked_until - now())) / 60)::integer
      ELSE 0
    END as minutes_remaining,
    rl.created_at,
    rl.updated_at
  FROM auth_rate_limits rl
  ORDER BY 
    CASE WHEN rl.locked_until IS NOT NULL AND rl.locked_until > now() THEN 0 ELSE 1 END,
    rl.last_attempt_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_rate_limits_for_admin() TO authenticated;

-- Create function to unlock rate limited accounts
CREATE OR REPLACE FUNCTION public.admin_unlock_rate_limit(_email TEXT, _type TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Clear the rate limit record
  DELETE FROM auth_rate_limits
  WHERE email = _email AND attempt_type = _type;
  
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_unlock_rate_limit(text, text) TO authenticated;