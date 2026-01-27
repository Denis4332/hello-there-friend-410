-- Fix 1: Recreate public_profiles view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT 
  id,
  slug,
  display_name,
  age,
  gender,
  city,
  canton,
  postal_code,
  lat,
  lng,
  about_me,
  languages,
  is_adult,
  verified_at,
  status,
  listing_type,
  premium_until,
  top_ad_until,
  created_at,
  updated_at
FROM profiles
WHERE status = 'active';

-- Grant SELECT to anon and authenticated
GRANT SELECT ON public.public_profiles TO anon, authenticated;