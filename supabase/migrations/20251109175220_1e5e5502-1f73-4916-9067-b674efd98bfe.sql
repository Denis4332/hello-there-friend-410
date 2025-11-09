-- Update auth_rate_limits to include password_reset type
ALTER TABLE public.auth_rate_limits 
  DROP CONSTRAINT IF EXISTS auth_rate_limits_attempt_type_check;

ALTER TABLE public.auth_rate_limits 
  ADD CONSTRAINT auth_rate_limits_attempt_type_check 
  CHECK (attempt_type IN ('login', 'signup', 'password_reset'));