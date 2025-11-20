-- Fix mutable search paths in database functions for security
-- Drop and recreate functions with proper search_path settings

-- Drop existing functions
DROP FUNCTION IF EXISTS public.check_auth_rate_limit(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.record_auth_attempt(TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.record_auth_attempt_with_ip(TEXT, TEXT, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.check_auth_rate_limit_with_ip(TEXT, TEXT, TEXT);

-- Recreate update_updated_at_column with fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- Recreate check_auth_rate_limit with fixed search_path
CREATE FUNCTION public.check_auth_rate_limit(_email TEXT, _type TEXT)
RETURNS Json AS $$
DECLARE
  rate_limit_record RECORD;
  max_attempts INTEGER := 5;
  lockout_minutes INTEGER := 15;
BEGIN
  SELECT * INTO rate_limit_record
  FROM auth_rate_limits
  WHERE email = _email AND attempt_type = _type;

  IF rate_limit_record IS NULL THEN
    RETURN json_build_object(
      'allowed', true,
      'remaining_attempts', max_attempts
    )::json;
  END IF;

  IF rate_limit_record.locked_until IS NOT NULL 
     AND rate_limit_record.locked_until > now() THEN
    RETURN json_build_object(
      'allowed', false,
      'remaining_attempts', 0,
      'locked_until', rate_limit_record.locked_until,
      'message', 'Zu viele fehlgeschlagene Versuche. Account ist gesperrt.'
    )::json;
  END IF;

  RETURN json_build_object(
    'allowed', true,
    'remaining_attempts', GREATEST(0, max_attempts - COALESCE(rate_limit_record.failed_attempts, 0))
  )::json;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- Recreate record_auth_attempt with fixed search_path
CREATE FUNCTION public.record_auth_attempt(_email TEXT, _type TEXT, _success BOOLEAN)
RETURNS VOID AS $$
DECLARE
  max_attempts INTEGER := 5;
  lockout_minutes INTEGER := 15;
  current_record RECORD;
BEGIN
  SELECT * INTO current_record
  FROM auth_rate_limits
  WHERE email = _email AND attempt_type = _type;

  IF _success THEN
    IF current_record IS NOT NULL THEN
      UPDATE auth_rate_limits
      SET failed_attempts = 0,
          locked_until = NULL,
          last_attempt_at = now(),
          updated_at = now()
      WHERE email = _email AND attempt_type = _type;
    END IF;
  ELSE
    IF current_record IS NULL THEN
      INSERT INTO auth_rate_limits (email, attempt_type, failed_attempts, last_attempt_at)
      VALUES (_email, _type, 1, now());
    ELSE
      UPDATE auth_rate_limits
      SET failed_attempts = failed_attempts + 1,
          last_attempt_at = now(),
          locked_until = CASE 
            WHEN failed_attempts + 1 >= max_attempts 
            THEN now() + (lockout_minutes || ' minutes')::INTERVAL
            ELSE locked_until
          END,
          updated_at = now()
      WHERE email = _email AND attempt_type = _type;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- Recreate record_auth_attempt_with_ip with fixed search_path
CREATE FUNCTION public.record_auth_attempt_with_ip(
  _email TEXT,
  _attempt_type TEXT,
  _success BOOLEAN,
  _ip_address TEXT
)
RETURNS VOID AS $$
DECLARE
  max_attempts INTEGER := 5;
  lockout_minutes INTEGER := 15;
  current_record RECORD;
BEGIN
  SELECT * INTO current_record
  FROM auth_rate_limits
  WHERE email = _email AND attempt_type = _attempt_type;

  IF _success THEN
    IF current_record IS NOT NULL THEN
      UPDATE auth_rate_limits
      SET failed_attempts = 0,
          locked_until = NULL,
          last_attempt_at = now(),
          ip_address = _ip_address,
          updated_at = now()
      WHERE email = _email AND attempt_type = _attempt_type;
    END IF;
  ELSE
    IF current_record IS NULL THEN
      INSERT INTO auth_rate_limits (email, attempt_type, failed_attempts, last_attempt_at, ip_address)
      VALUES (_email, _attempt_type, 1, now(), _ip_address);
    ELSE
      UPDATE auth_rate_limits
      SET failed_attempts = failed_attempts + 1,
          last_attempt_at = now(),
          ip_address = _ip_address,
          locked_until = CASE 
            WHEN failed_attempts + 1 >= max_attempts 
            THEN now() + (lockout_minutes || ' minutes')::INTERVAL
            ELSE locked_until
          END,
          updated_at = now()
      WHERE email = _email AND attempt_type = _attempt_type;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- Recreate check_auth_rate_limit_with_ip with fixed search_path
CREATE FUNCTION public.check_auth_rate_limit_with_ip(_email TEXT, _type TEXT, _ip_address TEXT)
RETURNS Json AS $$
DECLARE
  rate_limit_record RECORD;
  max_attempts INTEGER := 5;
  lockout_minutes INTEGER := 15;
BEGIN
  SELECT * INTO rate_limit_record
  FROM auth_rate_limits
  WHERE email = _email AND attempt_type = _type;

  IF rate_limit_record IS NULL THEN
    RETURN json_build_object(
      'allowed', true,
      'remaining_attempts', max_attempts
    )::json;
  END IF;

  IF rate_limit_record.locked_until IS NOT NULL 
     AND rate_limit_record.locked_until > now() THEN
    RETURN json_build_object(
      'allowed', false,
      'remaining_attempts', 0,
      'locked_until', rate_limit_record.locked_until,
      'message', 'Zu viele fehlgeschlagene Versuche. Bitte warten Sie ' || 
                 EXTRACT(EPOCH FROM (rate_limit_record.locked_until - now()))/60 || ' Minuten.'
    )::json;
  END IF;

  RETURN json_build_object(
    'allowed', true,
    'remaining_attempts', GREATEST(0, max_attempts - COALESCE(rate_limit_record.failed_attempts, 0))
  )::json;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;