-- Phase 3: Neue V2 Funktion mit eingebetteten Photos + Categories
-- V1 bleibt unverändert für Backwards Compatibility

CREATE OR REPLACE FUNCTION public.search_profiles_by_radius_v2(
  user_lat numeric, 
  user_lng numeric, 
  radius_km numeric, 
  filter_category_id uuid DEFAULT NULL, 
  filter_keyword text DEFAULT NULL, 
  p_page integer DEFAULT 1, 
  p_page_size integer DEFAULT 24, 
  p_rotation_seed bigint DEFAULT 0
)
RETURNS TABLE(
  id uuid, 
  display_name text, 
  age integer, 
  gender text, 
  city text, 
  canton text, 
  postal_code text, 
  about_me text, 
  languages text[], 
  status text, 
  listing_type text, 
  verified_at timestamptz, 
  premium_until timestamptz, 
  top_ad_until timestamptz, 
  created_at timestamptz, 
  updated_at timestamptz, 
  slug text, 
  lat numeric, 
  lng numeric, 
  is_adult boolean, 
  availability_status text, 
  distance_km double precision, 
  street_address text, 
  show_street boolean, 
  total_count bigint,
  photos jsonb,
  profile_categories jsonb
)
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  WITH filtered AS (
    -- Schritt 1: Alle Profile im Radius mit Keyword/Category Filter
    SELECT 
      p.id, p.display_name, p.age, p.gender, p.city, p.canton, 
      p.postal_code, p.about_me, p.languages, p.status, p.listing_type,
      p.verified_at, p.premium_until, p.top_ad_until, p.created_at, 
      p.updated_at, p.slug, p.lat, p.lng, p.is_adult, p.availability_status,
      (6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(p.lat)) * 
          cos(radians(p.lng) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(p.lat))
        ))
      )) AS distance_km
    FROM profiles p
    WHERE p.status = 'active'
      AND p.lat IS NOT NULL 
      AND p.lng IS NOT NULL
      AND (6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(p.lat)) * 
          cos(radians(p.lng) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(p.lat))
        ))
      )) <= radius_km
      -- Category Filter via EXISTS (kein JOIN = keine Duplikate)
      AND (filter_category_id IS NULL OR EXISTS (
        SELECT 1 FROM profile_categories pc 
        WHERE pc.profile_id = p.id AND pc.category_id = filter_category_id
      ))
      -- Keyword Filter
      AND (filter_keyword IS NULL OR filter_keyword = '' OR 
           p.display_name ILIKE '%' || filter_keyword || '%' OR 
           p.about_me ILIKE '%' || filter_keyword || '%' OR
           p.city ILIKE '%' || filter_keyword || '%')
  ),
  ranked AS (
    -- Schritt 2: Tier-Order + Pseudo-Random Rotation
    SELECT 
      f.*,
      CASE 
        WHEN f.listing_type = 'top' AND f.top_ad_until > NOW() THEN 1
        WHEN f.listing_type = 'premium' AND f.premium_until > NOW() THEN 2
        ELSE 3
      END AS tier_order,
      md5(f.id::text || p_rotation_seed::text) AS rand_key,
      count(*) OVER() AS total_cnt
    FROM filtered f
  ),
  paged AS (
    -- Schritt 3: Sortieren + Pagination
    SELECT *
    FROM ranked
    ORDER BY tier_order, rand_key
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size
  )
  -- Final: Mit Contacts + Photos + Categories joinen
  SELECT 
    pg.id, pg.display_name, pg.age, pg.gender, pg.city, pg.canton,
    pg.postal_code, pg.about_me, pg.languages, pg.status, pg.listing_type,
    pg.verified_at, pg.premium_until, pg.top_ad_until, pg.created_at,
    pg.updated_at, pg.slug, pg.lat, pg.lng, pg.is_adult, pg.availability_status,
    pg.distance_km,
    pco.street_address,
    pco.show_street,
    pg.total_cnt AS total_count,
    -- Photos als JSONB Array
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'storage_path', ph.storage_path,
        'is_primary', ph.is_primary,
        'media_type', ph.media_type
      ) ORDER BY ph.is_primary DESC NULLS LAST, ph.created_at)
      FROM photos ph WHERE ph.profile_id = pg.id
    ), '[]'::jsonb) AS photos,
    -- Categories als JSONB Array  
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'category_id', pcat.category_id,
        'categories', jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug
        )
      ))
      FROM profile_categories pcat
      JOIN categories c ON c.id = pcat.category_id
      WHERE pcat.profile_id = pg.id
    ), '[]'::jsonb) AS profile_categories
  FROM paged pg
  LEFT JOIN profile_contacts pco ON pco.profile_id = pg.id
  ORDER BY pg.tier_order, pg.rand_key;
$$;

-- Grant execute permission (öffentlich aufrufbar wie V1)
GRANT EXECUTE ON FUNCTION public.search_profiles_by_radius_v2 TO anon, authenticated;