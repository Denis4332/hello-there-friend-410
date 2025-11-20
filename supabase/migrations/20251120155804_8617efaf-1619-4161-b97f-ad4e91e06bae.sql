-- GPS-Koordinaten wieder zur public_profiles View hinzufügen für Umkreissuche
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles AS
SELECT 
  id, slug, display_name, age, gender, city, canton, postal_code,
  lat, lng, about_me, languages, is_adult, verified_at, status,
  listing_type, premium_until, top_ad_until, created_at, updated_at
FROM profiles
WHERE status = 'active';

-- RLS für View aktivieren
ALTER VIEW public_profiles SET (security_invoker = true);