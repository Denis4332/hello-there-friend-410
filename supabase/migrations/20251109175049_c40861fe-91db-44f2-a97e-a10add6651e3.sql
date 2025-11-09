-- Create table for tracking authentication rate limits
CREATE TABLE public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempt_type text NOT NULL CHECK (attempt_type IN ('login', 'signup')),
  failed_attempts integer DEFAULT 0,
  last_attempt_at timestamptz DEFAULT now(),
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(email, attempt_type)
);

-- Create indexes for performance
CREATE INDEX idx_auth_rate_limits_email ON public.auth_rate_limits(email);
CREATE INDEX idx_auth_rate_limits_locked ON public.auth_rate_limits(locked_until) WHERE locked_until IS NOT NULL;
CREATE INDEX idx_auth_rate_limits_last_attempt ON public.auth_rate_limits(last_attempt_at);

-- Enable RLS (this table doesn't need user-level access, only functions will access it)
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access - only system functions can access this table
CREATE POLICY "No direct access to rate limits"
  ON public.auth_rate_limits
  FOR ALL
  USING (false);

-- Function to check if authentication attempt is allowed
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(_email TEXT, _type TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record record;
  v_max_attempts INTEGER := 5;
  v_lockout_duration INTERVAL := '15 minutes';
  v_window_duration INTERVAL := '5 minutes';
BEGIN
  -- Normalize email
  _email := lower(trim(_email));
  
  -- Get rate limit record
  SELECT * INTO v_record
  FROM auth_rate_limits
  WHERE email = _email AND attempt_type = _type;
  
  -- If no record exists, allow the attempt
  IF v_record IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining_attempts', v_max_attempts
    );
  END IF;
  
  -- Check if account is currently locked
  IF v_record.locked_until IS NOT NULL AND v_record.locked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'locked_until', v_record.locked_until,
      'message', 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.'
    );
  END IF;
  
  -- Reset counter if last attempt was outside the window
  IF v_record.last_attempt_at < (now() - v_window_duration) THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining_attempts', v_max_attempts
    );
  END IF;
  
  -- Check if max attempts reached
  IF v_record.failed_attempts >= v_max_attempts THEN
    -- Lock the account
    UPDATE auth_rate_limits
    SET locked_until = now() + v_lockout_duration,
        updated_at = now()
    WHERE email = _email AND attempt_type = _type;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'locked_until', now() + v_lockout_duration,
      'message', 'Zu viele fehlgeschlagene Versuche. Account wurde für 15 Minuten gesperrt.'
    );
  END IF;
  
  -- Allow attempt with remaining count
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining_attempts', v_max_attempts - v_record.failed_attempts
  );
END;
$$;

-- Function to record authentication attempt
CREATE OR REPLACE FUNCTION public.record_auth_attempt(_email TEXT, _type TEXT, _success BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normalize email
  _email := lower(trim(_email));
  
  IF _success THEN
    -- Clear rate limit on successful login
    DELETE FROM auth_rate_limits
    WHERE email = _email AND attempt_type = _type;
  ELSE
    -- Record failed attempt
    INSERT INTO auth_rate_limits (email, attempt_type, failed_attempts, last_attempt_at)
    VALUES (_email, _type, 1, now())
    ON CONFLICT (email, attempt_type) 
    DO UPDATE SET
      failed_attempts = auth_rate_limits.failed_attempts + 1,
      last_attempt_at = now(),
      updated_at = now();
  END IF;
END;
$$;

-- Function to cleanup old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_auth_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete records older than 24 hours
  DELETE FROM auth_rate_limits
  WHERE last_attempt_at < now() - INTERVAL '24 hours'
    AND (locked_until IS NULL OR locked_until < now());
END;
$$;