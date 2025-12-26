-- Erweitere search_profiles_by_radius mit Pagination, Rotation und total_count
-- Ersetzt die alte Funktion komplett
DROP FUNCTION IF EXISTS search_profiles_by_radius(numeric, numeric, numeric, uuid, text);

CREATE OR REPLACE FUNCTION search_profiles_by_radius(
  user_lat NUMERIC,
  user_lng NUMERIC,
  radius_km NUMERIC,
  filter_category_id UUID DEFAULT NULL,
  filter_keyword TEXT DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 24,
  p_rotation_seed BIGINT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  age INT,
  gender TEXT,
  city TEXT,
  canton TEXT,
  postal_code TEXT,
  about_me TEXT,
  languages TEXT[],
  status TEXT,
  listing_type TEXT,
  verified_at TIMESTAMPTZ,
  premium_until TIMESTAMPTZ,
  top_ad_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  slug TEXT,
  lat NUMERIC,
  lng NUMERIC,
  is_adult BOOLEAN,
  availability_status TEXT,
  distance_km DOUBLE PRECISION,
  street_address TEXT,
  show_street BOOLEAN,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INT;
  v_total BIGINT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  -- Zähle Gesamtzahl der passenden Profile im Radius
  SELECT COUNT(DISTINCT p.id) INTO v_total
  FROM profiles p
  LEFT JOIN profile_categories pc ON p.id = pc.profile_id
  LEFT JOIN profile_contacts pco ON p.id = pco.profile_id
  WHERE p.status = 'active'
    AND p.lat IS NOT NULL 
    AND p.lng IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat)) * 
        cos(radians(p.lng) - radians(user_lng)) + 
        sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) <= radius_km
    AND (filter_category_id IS NULL OR pc.category_id = filter_category_id)
    AND (filter_keyword IS NULL OR filter_keyword = '' OR 
         p.display_name ILIKE '%' || filter_keyword || '%' OR 
         p.about_me ILIKE '%' || filter_keyword || '%' OR
         p.city ILIKE '%' || filter_keyword || '%');

  -- Gebe paginierte Ergebnisse mit Tier-Sortierung und Rotation zurück
  RETURN QUERY
  SELECT DISTINCT ON (sub.id)
    sub.id,
    sub.display_name,
    sub.age,
    sub.gender,
    sub.city,
    sub.canton,
    sub.postal_code,
    sub.about_me,
    sub.languages,
    sub.status,
    sub.listing_type,
    sub.verified_at,
    sub.premium_until,
    sub.top_ad_until,
    sub.created_at,
    sub.updated_at,
    sub.slug,
    sub.lat,
    sub.lng,
    sub.is_adult,
    sub.availability_status,
    sub.distance_km,
    sub.street_address,
    sub.show_street,
    v_total as total_count
  FROM (
    SELECT 
      p.id,
      p.display_name,
      p.age,
      p.gender,
      p.city,
      p.canton,
      p.postal_code,
      p.about_me,
      p.languages,
      p.status,
      p.listing_type,
      p.verified_at,
      p.premium_until,
      p.top_ad_until,
      p.created_at,
      p.updated_at,
      p.slug,
      p.lat,
      p.lng,
      p.is_adult,
      p.availability_status,
      (
        6371 * acos(
          cos(radians(user_lat)) * cos(radians(p.lat)) * 
          cos(radians(p.lng) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(p.lat))
        )
      ) as distance_km,
      pco.street_address,
      pco.show_street,
      -- Sortier-Keys für ORDER BY
      CASE 
        WHEN p.listing_type = 'TOP' AND p.top_ad_until > NOW() THEN 1
        WHEN p.listing_type = 'premium' AND p.premium_until > NOW() THEN 2
        ELSE 3
      END as tier_priority,
      md5(p.id::text || p_rotation_seed::text) as rotation_hash
    FROM profiles p
    LEFT JOIN profile_categories pc ON p.id = pc.profile_id
    LEFT JOIN profile_contacts pco ON p.id = pco.profile_id
    WHERE p.status = 'active'
      AND p.lat IS NOT NULL 
      AND p.lng IS NOT NULL
      AND (
        6371 * acos(
          cos(radians(user_lat)) * cos(radians(p.lat)) * 
          cos(radians(p.lng) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(p.lat))
        )
      ) <= radius_km
      AND (filter_category_id IS NULL OR pc.category_id = filter_category_id)
      AND (filter_keyword IS NULL OR filter_keyword = '' OR 
           p.display_name ILIKE '%' || filter_keyword || '%' OR 
           p.about_me ILIKE '%' || filter_keyword || '%' OR
           p.city ILIKE '%' || filter_keyword || '%')
    ORDER BY tier_priority, rotation_hash
  ) sub
  ORDER BY sub.id, sub.tier_priority, sub.rotation_hash
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;