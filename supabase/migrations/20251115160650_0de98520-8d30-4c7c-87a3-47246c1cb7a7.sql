-- PHASE 1: SECURITY FIXES

-- 1.1 Security Definer View auf SECURITY INVOKER umstellen
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles WITH (security_invoker = true) AS
SELECT 
  id, display_name, age, gender, city, canton, postal_code,
  slug, about_me, languages, verified_at, premium_until, top_ad_until,
  listing_type, is_adult, status, created_at, updated_at
FROM profiles
WHERE status = 'active';

-- 1.2 Function Search Path setzen für Security
ALTER FUNCTION has_role(_user_id uuid, _role app_role) SET search_path = public;
ALTER FUNCTION check_contact_rate_limit(_email text) SET search_path = public;
ALTER FUNCTION check_auth_rate_limit(_email text, _type text) SET search_path = public;
ALTER FUNCTION record_auth_attempt(_email text, _type text, _success boolean) SET search_path = public;
ALTER FUNCTION record_auth_attempt_with_ip(_email text, _attempt_type text, _success boolean, _ip_address text) SET search_path = public;