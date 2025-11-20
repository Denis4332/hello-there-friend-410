-- ============================================
-- SICHERHEITSFIX 1: public_profiles View neu erstellen ohne user_id
-- ============================================
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles AS
SELECT 
  id, slug, display_name, age, gender, city, canton, postal_code,
  about_me, languages, is_adult, verified_at, status,
  listing_type, premium_until, top_ad_until, created_at, updated_at
FROM profiles
WHERE status = 'active';

-- RLS für View aktivieren
ALTER VIEW public_profiles SET (security_invoker = true);

-- ============================================
-- SICHERHEITSFIX 2: RLS-Policy für profile_contacts
-- ============================================
CREATE POLICY "Authenticated users can view active profile contacts"
ON profile_contacts
FOR SELECT
TO authenticated
USING (
  profile_id IN (
    SELECT id FROM profiles 
    WHERE status = 'active'
  )
);

-- ============================================
-- SICHERHEITSFIX 3: Auto-Delete für search_queries nach 7 Tagen
-- ============================================
SELECT cron.schedule(
  'cleanup-old-search-queries',
  '0 4 * * *', -- Täglich um 04:00 UTC
  $$
    DELETE FROM search_queries 
    WHERE created_at < NOW() - INTERVAL '7 days';
  $$
);